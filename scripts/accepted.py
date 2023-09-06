# Reads a spreadsheet downloaded as a CSV table.
import argparse
import csv

parser = argparse.ArgumentParser()
parser.add_argument("-papers", "--papers", help="CSV file with accepted papers")
parser.add_argument("-demos", "--demos", help="CSV file with accepted papers")
parser.add_argument("-out", "--out", help="Output markdown file")

COMMENT = "[comment]: (This file was generated using scripts/accepted_papers.py)"

HEADER = ("---\n"
          "title: Accepted Papers\n"
          "layout: single\n"
          "excerpt: \"NAACL 2021 Accepted Papers.\"\n"
          "permalink: /program/accepted/\n"
          "toc: true\n"
          "toc_sticky: true\n"
          "toc_icon: \"cog\"\n"
          "sidebar:\n"
          "    nav: program\n"
          "---")


def write_title_authors(writer, title, authors):
  writer.write("**" + title + "**<br>")
  writer.write(authors + "\n\n")


def main():
  args = parser.parse_args()

  with open(args.out, "w") as mdfile:
    mdfile.write(HEADER + "\n")
    mdfile.write(COMMENT + "\n")

    # Accepted papers.
    mdfile.write("\nMain Conference\n---\n")
    with open(args.papers) as csvfile:
      reader = csv.DictReader(csvfile, delimiter=",")
      for i, row in enumerate(reader):
        submission_id, title, authors, status = (
            row['Paper Id'], row['Title'], row['Authors'], row['Status'])
        if status.strip().lower() == "accept":
          write_title_authors(mdfile, title, authors)

    # Accepted demos.
    mdfile.write("\nSystem Demonstrations\n---\n")
    with open(args.demos) as csvfile:
      reader = csv.DictReader(csvfile, delimiter=",")
      for i, row in enumerate(reader):
        submission_id, title, authors, status = (
            row['Paper Id'], row['Title'], row['Authors'], row['Status'])
        if status.strip().lower() == "accept":
          write_title_authors(mdfile, title, authors)


if __name__ == "__main__":
    main()
