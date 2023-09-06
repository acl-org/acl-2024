#!/usr/bin/env python
"""Verify the "Accepted Papers" page against the bibtex from Anthology.

Requirements:
  Download the bib files (main, industry, demo) from the Anthology
  (https://www.aclweb.org/anthology/events/naacl-2021/)

  pip install bibtexparser latexcodec

Usage:
  ./scripts/check_accepted_papers.py _pages/program/accepted.md \
      ~/downloaded-bibs-from-anthology/*.bib > _pages/program/accepted.check.md
"""
import argparse
import difflib
import re

import bibtexparser
import latexcodec


def format_title(title):
  title = title.encode('utf8').decode('latex')
  return title.replace('{', '').replace('}', '')


def format_author(author):
  author = author.encode('utf8').decode('latex')
  author = author.replace('{', '').replace('}', '').replace('\n', ' ')
  author = re.sub(r'\s+', ' ', author)
  names = []
  # Smith, John --> John Smith
  for name in author.split(' and '):
    names.append(' '.join(x.strip() for x in name.split(',')[::-1]))
  if len(names) == 1:
    return names[0]
  elif len(names) == 2:
    return names[0] + ' and ' + names[1]
  else:
    return ', '.join(names[:-1]) + ' and ' + names[-1]


def process_bib_file(filename):
  with open(filename) as fin:
    db = bibtexparser.bparser.BibTexParser(common_strings=True).parse_file(fin)
  for entry in db.entries:
    if 'author' in entry:
      yield '{}\t{}'.format(
        format_title(entry['title']),
        format_author(entry['author']))


def verify(bibs, entry):
  # Find matching entry from bibs + print if not exactly match
  matches = difflib.get_close_matches(entry, bibs)
  if not matches:
    print('@@@ NO MATCHES')
  else:
    match = matches[0]
    bibs.remove(match)
    if entry != match:
      print('@@@ CHECK')
      print('**' + match.replace('\t', '**<br>'))


def main():
  parser = argparse.ArgumentParser()
  parser.add_argument('md_file')
  parser.add_argument('bib_files', nargs='+')
  args = parser.parse_args()

  # Read the bibs
  bibs = []
  for filename in args.bib_files:
    bibs.extend(process_bib_file(filename))

  # Verify the entries from the accepted paper list.
  # Print the original content plus any conflicts detected.
  with open(args.md_file) as fin:
    for line in fin:
      print(line.rstrip())
      if line.startswith('**'):
        m = re.match(r'\*\*(.*)\*\*<br>(.*)', line)
        title, author = m.groups()
        verify(bibs, '{}\t{}'.format(title, author))

  # Print the remaining bib items
  for unused in bibs:
    print('@@@ UNUSED')
    print('**' + unused.replace('\t', '**<br>'))


if __name__ == '__main__':
  main()
