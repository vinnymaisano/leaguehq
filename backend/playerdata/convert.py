import json

fields = {"age", "full_name", "years_exp", "team", "birth_date", "position", }

with open("nfl.json", "r") as f:
    data = json.load(f)

with open("players.json", "w") as f:
    for key, value in data.items():
        if value["position"] in ["QB", "RB", "WR", "TE"]:
            filtered_values = {k:v for k, v in value.items() if k in fields}
            doc = {"_id": key, **filtered_values}
            f.write(json.dumps(doc) + "\n")