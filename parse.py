#!/usr/bin/env python
# Parses xssAttacks.xml and produces a json file

import lxml.etree
import json

props = { "name" : "name", "description" : "desc", "vector" : "code" }
attacks = []
tree = lxml.etree.parse("xssAttacks.xml")

for attack in tree.findall("attack"):
    obj = {}
    for prop, child in props.iteritems():
        obj[prop] = attack.findtext(child)
    attacks.append(obj)

out = open("xssAttacks.json", "w")
json.dump(attacks, out, sort_keys=True, indent=3)
out.close()
