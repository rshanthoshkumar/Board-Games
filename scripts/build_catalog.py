import json, re
src = json.load(open('/mnt/user-uploads/playroom-games-dataset.json'))['games']
old = open('/dev-server/src/lib/games.ts').read()
olddesc = {}
for line in old.split('RAW = `')[1].split('`;')[0].split('\n'):
    p = line.split('|')
    if len(p) >= 12: olddesc[p[0].lower()] = p[11]

OVERRIDE_DESC = {
 "Fruit Fight": "Take turns grabbing fruit cards and push your luck — collect the best set without getting caught out.",
 "Night Knight": "Pilo Pilo (Night Knight): knights sneak around a pillow fort at night — grab the right piece fast before anyone else.",
 "Pilo Pilo": "Knights sneak around a pillow fort at night — spot the right piece and grab it before anyone else.",
 "Hexpert": "Hexpert (Take It Easy!): everyone places the same hex tiles on their own board to build long, matching lines.",
 "Corridor": "Corridor (Quoridor): race your pawn to the far side while placing walls to slow everyone else down.",
 "Blokus": "Place colourful pieces so they touch your own only at the corners — and block everyone else out.",
 "Grabolo": "Roll the dice, then race to find and grab the matching shapes before anyone else.",
 "Criss Cross": "Roll dice and write numbers into your grid to build scoring rows and columns.",
 "Can't Stop": "Roll dice and race up columns — keep rolling for more progress or stop before you bust.",
 "DiceUp": "Roll dice and race to match the cards in front of you before anyone else.",
 "Chess": "The classic two-player strategy game — checkmate your opponent's king.",
 "Sequence": "Play cards to claim spaces on the board and make rows of five with your team.",
 "UNO: Show 'em No Mercy": "UNO turned up to eleven — brutal draw cards and knock-outs. Loud and chaotic.",
}

STRONG_MOOD = {
 "silly": ["Taco Cat Goat Cheese Pizza","Herd Mentality","Pilo Pilo","Grab That Dino","Dixit","Hues and Cues","Tapple","CLACK!","Pictureka!","Pictionary","Articulate!"],
 "relax": ["Dixit","Hues and Cues","Kingdomino","Harmonies","Sushi Go!","Rummikub","Hexpert","Sequence"],
 "compete": ["UNO","UNO Flip!","UNO: Show 'em No Mercy","Coup","Catan","Sequence","Jaipur","Othello","Abalone","Stratego","7 Wonders Duel","Monopoly Bid"],
 "think": ["Kingdomino","Ticket to Ride: Europe","Catan","Pandemic","Wingspan","Harmonies","Onitama","Jaipur","7 Wonders","7 Wonders Duel","Othello","Abalone","Stratego"],
 "mystery": ["Pandemic","Scotland Yard","Cluedo","Treasure Island","Clue Conspiracy"],
 "energetic": ["Taco Cat Goat Cheese Pizza","Grab That Dino","Pilo Pilo","Dobble","Spot It!","Tapple","CLACK!","Jenga","Topple","Flip 7"],
}
STRONG_INT = {
 "coop": ["Pandemic","Sequence","Pictionary","Articulate!","Taboo"],
 "solo": ["Sushi Go!","Kingdomino","Ticket to Ride: Europe","Catan","Wingspan","Harmonies","Rummikub","Flip 7"],
 "teams": ["Sequence","Pictionary","Taboo","Articulate!","Clue Conspiracy"],
 "bluff": ["Coup","Cuff the Bluff","Traitor Tots","Clue Conspiracy","Exploding Kittens","OrganATTACK!","Monopoly Bid"],
 "friendly": ["Dixit","Hues and Cues","Kingdomino","Harmonies","Dobble","Spot It!","CLACK!","Pictureka!","Guess Who?"],
}
VIBE = {  # vibe -> (moods, interactions, energy 1-3, conflict 1-3)
 "Light party": (["silly","compete"],["solo"],2,2),
 "High-energy party": (["silly","energetic"],["solo"],3,2),
 "Word party": (["silly"],["teams"],2,1),
 "Friendly family": (["relax"],["friendly","solo"],1,1),
 "Light strategy": (["think"],["solo"],1,2),
 "Abstract duel": (["think","compete"],["solo"],1,3),
 "High-conflict strategy": (["compete","think"],["solo","bluff"],1,3),
 "Dexterity": (["energetic","silly"],["friendly","solo"],2,1),
 "Low-conflict deduction": (["mystery"],["solo"],1,1),
 "Bluffing": (["compete"],["bluff"],2,3),
 "Social deduction": (["mystery","silly"],["bluff"],2,2),
 "Low-conflict party": (["relax","silly"],["friendly"],2,1),
 "Low-conflict co-op": (["think","mystery"],["coop"],1,1),
 "Low-conflict strategy": (["relax","think"],["solo","friendly"],1,1),
 "Low-conflict abstract": (["relax","think"],["solo","friendly"],1,1),
 "Puzzle": (["relax"],["friendly"],1,1),
}
INTEREST_KW = {
 "words": ["word","trivia","pun","category","letter","description","yes-or-no"],
 "mystery": ["deduction","hidden","murder","escape","bluff","chase"],
 "strategy": ["drafting","strategy","trading","settlement","routes","tile","civilization","kingdom","territory","market","conquest","co-op","landscape","rummy","trick"],
 "cards": ["card","set collection","take-that","push-your-luck","dice","matching","betting"],
 "creative": ["drawing","storytelling","color communication","picture","pun","creative"],
 "dexterity": ["dexterity","reflex","speed","grab","stack","balanc","sticks","eating","search race"],
 "adventure": ["train","island","landscape","kingdom","pirate","civilization","treasure","dino","fandom","disease","sushi","knight","pillow","fruit"],
 "classic": ["abstract","classic","chess","rummy","four-in-a-row","slide","race-and-capture","property","roll-and-move","tile rummy","traditional"],
}
EXCLUDE_GROUP = ["Bicycle Standard Playing Cards","Crazy Face Puzzle","Brainvita","Superhero Puzzle","Gocrazy Jigsaw","Unidentified: Tetrix"]
ALIAS = {"Fruit Fight":"Pelusas","Pilo Pilo":"Night Knight","Hexpert":"Take It Easy!","Corridor":"Quoridor","Blokus":"Standard Blokus rules (XL box)"}
AGE_MIN = {"Clue Conspiracy":14,"Coup":13,"Pun Intended":13,"Cuff the Bluff":12,"Articulate!":12,"Pictionary":12,"Scattergories":12}
FRANCHISE = [("UNO","uno"),("Monopoly","monopoly"),("Exploding Kittens","exploding-kittens"),("Sushi Go","sushi-go"),("Trivial Pursuit","trivial-pursuit"),("Clue","clue"),("Cluedo","clue"),("7 Wonders","7-wonders"),("Dobble","dobble"),("Spot It","dobble"),("Onitama","onitama"),("Chess","chess"),("The Game of Life","life")]

def rng(s):
    if not s or s == "Unknown": return None
    n = [int(x) for x in re.findall(r"\d+", s)]
    return (n[0], n[-1]) if n else None

out, seen = [], {}
for g in src:
    t = g["gameTitle"]
    if t in seen:  # duplicate stock of the same title
        seen[t]["quantity"] += g["quantity"]; seen[t]["inventoryNames"].append(g["inventoryName"]); continue
    pc, ip, pt = rng(g["playerCount"]), rng(g["idealPlayerCount"]), rng(g["estimatedPlaytime"])
    vibe = g["vibeAndConflict"]
    vm, vi, energy, conflict = VIBE.get(vibe, ([],[],1,1))
    strongM = [m for m, l in STRONG_MOOD.items() if t in l]
    strongI = [i for i, l in STRONG_INT.items() if t in l]
    text = (g["theme"] + " " + vibe).lower()
    ints = [k for k, kws in INTEREST_KW.items() if any(w in text for w in kws)]
    aud = g["targetAudience"].lower()
    groups = [k for k, w in [("family","famil"),("kids","kid"),("adults","date night"),("adults","serious"),("adults","strategy"),("teens","teen"),("large","large")] if w in aud]
    if "casual" in aud or "first-time" in aud: groups += ["adults","teens","mixed"]
    fam = next((f for p, f in FRANCHISE if t.startswith(p)), re.sub(r"[^a-z0-9]+","-",t.lower()).strip("-"))
    excl = None
    if g["dataConfidence"] == "low": excl = "low-confidence"
    if g["minimumAge"] and g["minimumAge"] >= 17: excl = "mature"
    if t in EXCLUDE_GROUP: excl = "solo-activity"
    old_key = g["inventoryName"].lower().replace("connect 4","connect 4")
    desc = OVERRIDE_DESC.get(t) or olddesc.get(g["inventoryName"].lower()) or olddesc.get(t.lower()) or g["notes"]
    rec = {
      "id": fam if t in ("Chess","The Game of Life") else re.sub(r"[^a-z0-9]+","-",t.lower()).strip("-"),
      "gameTitle": t, "inventoryName": g["inventoryName"], "inventoryNames": [g["inventoryName"]],
      "alias": ALIAS.get(t), "quantity": g["quantity"], "theme": g["theme"],
      "playerCount": g["playerCount"], "idealPlayerCount": g["idealPlayerCount"],
      "estimatedPlaytime": g["estimatedPlaytime"], "difficulty": g["difficulty"],
      "bggComplexity": g["bggComplexity"], "setupTime": g["setupTime"], "tableFootprint": g["tableFootprint"],
      "staffTeachMinutes": g["staffTeachMinutes"], "vibeAndConflict": vibe, "targetAudience": g["targetAudience"],
      "minimumAge": max(g["minimumAge"] or 0, AGE_MIN.get(t, 0)) or None,
      "dataConfidence": g["dataConfidence"], "notes": g["notes"], "description": desc,
      "tags": {
        "minPlayers": pc[0] if pc else None, "maxPlayers": pc[1] if pc else None,
        "idealMin": ip[0] if ip else None, "idealMax": ip[1] if ip else None,
        "minTime": pt[0] if pt else None, "maxTime": pt[1] if pt else None,
        "moods": sorted(set(strongM + vm)), "strongMoods": strongM,
        "interactions": sorted(set(strongI + vi)), "strongInteractions": strongI,
        "interests": ints, "groupTypes": sorted(set(groups)),
        "teachEffort": 1 if (g["staffTeachMinutes"] or 99) <= 5 else 2 if (g["staffTeachMinutes"] or 99) <= 10 else 3,
        "partyEnergy": energy, "conflictLevel": conflict,
        "family": fam, "isExpansion": "expansion" in g["theme"].lower(), "excluded": excl,
      },
    }
    seen[t] = rec; out.append(rec)
json.dump(out, open('/dev-server/src/lib/catalog.json','w'), ensure_ascii=False, indent=1)
print(len(out), sum(1 for r in out if not r["tags"]["excluded"]))
print([r["gameTitle"] for r in out if r["description"] == r["notes"]])
print([r["gameTitle"] for r in out if not r["tags"]["interests"] and not r["tags"]["excluded"]])
