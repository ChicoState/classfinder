"""Filter a trusted OSM XML extract into ClassFinder's pedestrian snapshot."""

import argparse
from collections import defaultdict
import json
import xml.etree.ElementTree as ET

parser = argparse.ArgumentParser(description=__doc__)
parser.add_argument("extract")
parser.add_argument("--downloaded", required=True, help="Download date, YYYY-MM-DD")
parser.add_argument("--output", default="src/routing/campus-paths.json")
args = parser.parse_args()
root = ET.parse(args.extract).getroot()
nodes = {node.get("id"): node for node in root.findall("node")}


def tags(element):
    return {tag.get("k"): tag.get("v") for tag in element.findall("tag")}


ways = []
for way in root.findall("way"):
    attributes = tags(way)
    kind = attributes.get("highway")
    foot = attributes.get("foot")
    if kind not in {"footway", "pedestrian", "path", "steps", "cycleway", "living_street"}:
        continue
    if foot in {"no", "private"}:
        continue
    if attributes.get("access") in {"no", "private"} and foot not in {
        "yes", "designated", "permissive"
    }:
        continue
    if attributes.get("indoor") == "yes" or attributes.get("area") == "yes":
        continue
    ids = [node.get("ref") for node in way.findall("nd")]
    if not all(node_id in nodes for node_id in ids):
        continue
    if any(
        tags(nodes[node_id]).get("access") in {"private", "no"}
        or tags(nodes[node_id]).get("barrier") in {"wall", "fence"}
        for node_id in ids
    ):
        continue
    ways.append({
        "id": way.get("id"), "nodes": ids,
        "name": attributes.get("name", ""), "kind": kind,
    })

adjacency = defaultdict(set)
for way in ways:
    for start, end in zip(way["nodes"], way["nodes"][1:]):
        adjacency[start].add(end)
        adjacency[end].add(start)

components = []
seen = set()
for start in adjacency:
    if start in seen:
        continue
    pending = [start]
    component = {start}
    seen.add(start)
    while pending:
        for neighbor in adjacency[pending.pop()]:
            if neighbor not in seen:
                seen.add(neighbor)
                component.add(neighbor)
                pending.append(neighbor)
    components.append(component)

if not components:
    raise SystemExit("No connected pedestrian ways found; existing snapshot unchanged.")
connected = max(components, key=len)
ways = [way for way in ways if way["nodes"][0] in connected]
positions = {
    node_id: [float(nodes[node_id].get("lat")), float(nodes[node_id].get("lon"))]
    for node_id in sorted(connected)
}
snapshot = {
    "metadata": {
        "source": "https://api.openstreetmap.org/api/0.6/map?bbox=-121.854,39.723,-121.838,39.736",
        "downloaded": args.downloaded,
        "license": "ODbL-1.0",
        "attribution": "© OpenStreetMap contributors",
        "copyright": "https://www.openstreetmap.org/copyright",
        "notes": "Largest connected pedestrian component; excludes private/no access, indoor ways and area polygons. Not an accessible-route dataset.",
    },
    "positions": positions,
    "ways": ways,
}
with open(args.output, "w") as output:
    json.dump(snapshot, output, indent=2)
print(f"Wrote {len(connected)} nodes and {len(ways)} ways to {args.output}")
