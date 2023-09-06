# Adds session chairs to the existing (static) program.html file.
# Source: https://docs.google.com/spreadsheets/d/1aoUGr44xmU6bnJ_S61WTJkwarOcKzI_u1BgK4H99Yt4/edit?usp=sharing
# Please download and save the spreadsheet in CSV format.

PATH_TO_CSV = "/tmp/sessions.csv"
#PATH_TO_HTML = "../conference-program/main/program.html"
PATH_TO_HTML_IN = "/tmp/program_old.html"
PATH_TO_HTML_OUT = "/tmp/program.html"

SESSION_TITLE_COL = 4
SESSION_CHAIR_COL = 6
SESSION_CHAIR_AFFILIATION = 7
SESSION_CHAIR_EMAIL = 8

import csv


def mailto(email):
  return '<a href="mailto:{}">email</a>'.format(email, email)


class Chair(object):
  def __init__(self, session, name, affiliation, email):
    self.session = session
    self.name = name
    self.affiliation = affiliation
    self.email = email

  @property
  def html(self):
    before = '<tr><td valign=top style="padding-top: 10px;">&nbsp;</td><td valign=top style="padding-top: 10px;"><i> Session chair: '
    after = '</i></td></tr>'
    return "{} {} ({}) {}".format(before, self.name, self.affiliation, after)


chairs = []
with open(PATH_TO_CSV, "r") as csvfile:
  csvreader = csv.reader(csvfile, delimiter=",")
  for i, session in enumerate(csvreader):
    if i == 0:
      assert session[SESSION_CHAIR_COL] == "Session Chair"  # sanity check that we got the column indices right
      continue  # skip header

    session_title = session[SESSION_TITLE_COL]
    name = session[SESSION_CHAIR_COL]
    affiliation = session[SESSION_CHAIR_AFFILIATION]
    email = session[SESSION_CHAIR_EMAIL]
    chairs.append(Chair(session_title, name, affiliation, email))


print("Found %d chairs" % len(chairs))
current_chair_idx = 0

with open(PATH_TO_HTML_OUT, "w") as out_html:
  with open(PATH_TO_HTML_IN, "r") as in_html:
    for line in in_html:
      out_html.write(line)

      if current_chair_idx < len(chairs):
        chair = chairs[current_chair_idx]
        if chair.session in line:
          # print another line with the session chair.
          print(chair.html)
          out_html.write(chair.html)
          current_chair_idx += 1
