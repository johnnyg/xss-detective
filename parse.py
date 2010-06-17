#!/usr/bin/env python
# Parses an xml file and produces a json file

import lxml.etree
import json
import os.path
import sys

filenames = [arg for arg in sys.argv[1:] if arg.endswith(".xml")]

for filename in filenames:
    props = { "name" : "name", "description" : "desc", "vector" : "code" }
    attacks = []
    tree = lxml.etree.parse(filename)

    for attack in tree.findall("attack"):
        obj = {}
        for prop, child in props.iteritems():
            obj[prop] = attack.findtext(child)
        attacks.append(obj)

    out = open(os.path.splitext(filename)[0] + ".json", 'w')
    json.dump(attacks, out, sort_keys=True, indent=3, separators=(',', " : "))
    out.write('\n')
    out.close()
