#!/usr/bin/env python3

"""
This script is used to generate the markdown file for
the conference schedule. This script uses the classes
defined in the `orderfile.py` module from the NAACL
2019 schedule repository that is integrated as a
submodule in this repository under the `agenda`
directory. For more details, run `generate.py --help`
and refer to the `README.md` file in this directory.

Author: Nitin Madnani
Date: May, 2019
"""


import argparse
import csv
import itertools
import json
import logging
import sys

from pathlib import Path

_THIS_DIR = Path(__file__).absolute().parent
AGENDA_SUBMODULE_DIR = _THIS_DIR.parent.joinpath('agenda', 'code')
sys.path.append(str(AGENDA_SUBMODULE_DIR))

from orderfile import Agenda, SessionGroup, Session, Item
from metadata import ScheduleMetadata


def authorlist_to_string(authorlist):
    """
    Function to convert a list of author names
    into a readable string, for example,
    ['X', 'Y', 'Z'] -> 'X, Y and Z'.
    """
    if len(authorlist) > 1:
        authors = '{} and {}'.format(', '.join(authorlist[:-1]), authorlist[-1])
    else:
        authors = authorlist[0]

    return authors


class WebAgenda(Agenda):
    """
    Class encapsulating the agenda for the website.
    Inherits from `orderfile.Agenda` and adds a
    `to_html()` method to convert the parsed agenda
    into HTML for the website.
    """

    # define the starting static HTML that we need
    # before the actual schedule HTML
    _starting_html = ['<link rel="stylesheet" href="/assets/css/alertify.min.css" id="alertifyCSS">',
                      '<table id="hidden-program-table">',
                      '<thead>',
                      '<tr><th>time</th><th>location</th><th>info</th></tr>'
                      '</thead>',
                      '<tbody></tbody>',
                      '</table>',
                      '<div id="introParagraph">',
                      '<p>On this page, you can choose the sessions (and individual papers/posters) of your choice <em>and</em> generate a PDF of your customized schedule! This page should work on modern browsers on all operating systems. On mobile devices, Safari on iOS and Chrome on Android are the only browsers known to work. For the best experience, use a non-mobile device with a resolution of at least 1920x1080 and a full-screen browser. For help, simply type "?"" while on the page or click on the "Help" button.</p>',
                      '</div>',
                      '<p class="text-center">',
                      '<a href="#" id="help-button" class="btn btn--small btn--twitter">Help</a>',
                      '</p>',
                      '<p class="text-center">',
                      '<a href="#" id="toggle-all-button" class="btn btn--small btn--twitter">Expand All Sessions ↓</a>',
                      '</p>',
                      '<div class="schedule">']

    # define the static HTML that goes at the end
    # of the actual schedule HTML
    _closing_html = ['<div id="generatePDFForm">',
                     '<div id="formContainer">',
                     '<input type="checkbox" id="includePlenaryCheckBox" value="second_checkbox"/>&nbsp;&nbsp;<span id="checkBoxLabel">Include plenary sessions in schedule</span>',
                     '<br/>',
                     '<a href="#" id="generatePDFButton" class="btn btn--twitter btn--large">Download PDF</a>'
                     '</div>',
                     '</div>',
                     '</div>']

    # define counters for session groups and breaks
    session_group_counter = itertools.count(start=1)
    break_session_counter = itertools.count(start=1)

    def __init__(self, *args):
        super(WebAgenda, self).__init__(*args)

    def to_html(self,
                metadata,
                pdf_icons=False,
                video_icons=False,
                plenary_info={}):
        """
        Convert agenda to HTML format compatible
        with the NAACL 2019 GitHub pages theme.

        Parameters
        ----------
        metadata : ScheduleMetadata
            An instance of `ScheduleMetadata`
            containing the title, authors,
            abstracts, and anthology URLs for
            each item, if applicable.
        pdf_icons : bool, optional
            Whether to generate the links to the
            anthology and other PDFs where appropriate.
            Defaults to `False`.
        video_icons : bool, optional
            Whether to generate the icons for
            each of the oral presentation items
            linked to the video of the talk.
            Defaults to `False`.
        plenary_info : dict, optional
            Optional dictionary containing
            additional info for some plenary
            sessions. Defaults to an empty
            dictionary.

        Returns
        -------
        agenda_html : list of str
            A list of strings for the schedule HTML.
        """

        # initialize the agenda HTML with the pre-schedule HTML
        agenda_html = WebAgenda._starting_html

        # iterate over the days in the agenda that should
        # already be in chronological order
        for day_index, day in enumerate(self.days):

            # generate HTML representing the day
            agenda_html.append('<div class="day" id="day-{}">{}</div>'.format(day_index + 1, str(day)))

            # now iterate over each day's contents
            for content in day.contents:

                # if it's a `SessionGroup`, cast it to the
                # `WebSessionGroup` class so that we can then
                # call its `to_html()` method; we do this by
                # monkeypatching the `__class__` attribute which
                # is fine since we are just adding new behavior
                # (methods), not new attributes.
                if isinstance(content, SessionGroup):
                    content.__class__ = WebSessionGroup
                    session_group_index = next(WebAgenda.session_group_counter)
                    session_group_html = content.to_html(day,
                                                         metadata,
                                                         session_group_index,
                                                         pdf_icons=pdf_icons,
                                                         video_icons=video_icons,
                                                         plenary_info=plenary_info)
                    agenda_html.extend(session_group_html)

                # if it's a `Session`, then cast it to `WebSession`
                # and call its `to_html()` method and save that to
                # the agenda HTML.
                elif isinstance(content, Session):
                    content.__class__ = WebSession
                    index = next(WebAgenda.break_session_counter) if content.type == 'break' else None
                    session_html = content.to_html(day,
                                                   metadata,
                                                   index=index,
                                                   pdf_icons=pdf_icons,
                                                   video_icons=video_icons,
                                                   plenary_info=plenary_info)
                    agenda_html.extend(session_html)

        # update with the post-schedule HTML
        agenda_html.extend(WebAgenda._closing_html)

        # convert the list to a string and return
        agenda_html = '\n'.join(agenda_html)
        return agenda_html


class WebSessionGroup(SessionGroup):
    """
    Class encapsulating a session group for the website.
    Inherits from `orderfile.SessionGroup` and adds a
    `to_html()` method to convert the parsed group
    into HTML for the website.
    """

    # initialize some counters we need
    parallel_paper_track_counter = itertools.cycle([1, 2, 3, 4, 5])
    poster_session_counter = itertools.count(start=1)

    def __init__(self):
        super(WebSessionGroup, self).__init__()

    def to_html(self,
                day,
                metadata,
                index,
                pdf_icons=False,
                video_icons=False,
                plenary_info={}):
        """
        Convert session group to HTML format compatible
        with the NAACL 2019 GitHub pages theme.

        Parameters
        ----------
        day : orderfile.Day
            The `Day` instance on which the session
            group is scheduled.
        metadata : ScheduleMetadata
            An instance of `ScheduleMetadata`
            containing the title, authors,
            abstracts, and anthology URLs for
            each item, if applicable.
        index : int
            An index to be used in the HTML tags
            for the box representing this session group.
        pdf_icons : bool, optional
            Whether to generate the links to the
            anthology and other PDFs where appropriate.
            Defaults to `False`.
        video_icons : bool, optional
            Whether to generate the icons for
            each of the oral presentation items
            linked to the video of the talk.
            Defaults to `False`.
        plenary_info : dict, optional
            Optional dictionary containing
            additional info for some plenary
            sessions. Defaults to an empty
            dictionary.

        Returns
        -------
        generated_html : list of str
            A list of strings for the session group HTML.
        """

        # initialize the HTML with a box and header that goes in the HTML
        generated_html = ['<div class="session-box" id="session-box-{}">'.format(index)]
        generated_html.append('<div class="session-header" id="session-header-{}">{}</div>'.format(index, self.title))

        # iterate over the sessions in the group which should
        # already be in chronological order
        for session in self.sessions:

            # cast `Session` to `WebSession` to enable
            # the call to `to_html()`.
            session.__class__ = WebSession

            # the sessions in session groups do not
            # have a start and end time defined in the
            # order file, so we need to inherit those
            # here since sessions _are_ displayed with
            # start and end times on the website
            session.start = self.start
            session.end = self.end

            # call the respective `to_html()` for the session
            # and save the HTML
            if session.type == 'paper':
                index = next(WebSessionGroup.parallel_paper_track_counter)
            elif session.type == 'poster':
                index = next(WebSessionGroup.poster_session_counter)
            session_html = session.to_html(day,
                                           metadata,
                                           index=index,
                                           pdf_icons=pdf_icons,
                                           video_icons=video_icons,
                                           plenary_info=plenary_info)
            generated_html.extend(session_html)

        # add any required closing tags for valid HTML and return
        generated_html.append('</div>')
        return generated_html


class WebSession(Session):
    """
    Class encapsulating a session for the website.
    Inherits from `orderfile.Session` and adds a
    `to_html()` method to convert the parsed session
    into HTML for the website.

    """
    def __init__(self):
        super(WebSession, self).__init__()

    def to_html(self,
                day,
                metadata,
                index=None,
                pdf_icons=False,
                video_icons=False,
                plenary_info={}):
        """
        Convert session to HTML format compatible
        with the NAACL 2019 GitHub pages theme.

        Parameters
        ----------
        day : orderfile.Day
            The `Day` instance on which the session
            is scheduled.
        metadata : ScheduleMetadata
            An instance of `ScheduleMetadata`
            containing the title, authors,
            abstracts, and anthology URLs for
            each item, if applicable.
        index : int, optional
            An index to be used in some of the HTML tags.
        pdf_icons : bool, optional
            Whether to generate the links to the
            anthology and other PDFs where appropriate.
            Defaults to `False`.
        video_icons : bool, optional
            Whether to generate the icons for
            each of the oral presentation items
            linked to the video of the talk.
            Defaults to `False`.
        plenary_info : dict, optional
            Optional dictionary containing
            additional info for some plenary
            sessions. Defaults to an empty
            dictionary.

        Returns
        -------
        generated_html : list of str
            A list of strings for the session HTML.
        """
        # initialize the result variable
        generated_html = []

        # generate the appropriate HTML for each type of session
        if self.type == 'break':
            break_html = '<div class="session session-break session-plenary" id="session-break-{}"><span class="session-title">{}</span><br/><span class="session-time" title="{}">{} &ndash; {}</span>'.format(index, self.title, str(day), self.start, self.end)

            # add the loation if we have any
            if self.location:
                break_html += '<br/><span class="btn btn--location session-location">{}</span>'.format(self.location)

            # close the div and append to result
            break_html += '</div>'
            generated_html.append(break_html)

        elif self.type == 'plenary':

            # some plenary sessions might be in external locations
            # so handle that case if we encounter it
            if self.location.endswith('(external)'):
                location_type = 'session-external-location'
                self.location = self.location.replace('(external)', '')
            else:
                location_type = 'session-location'

            # check if we have additional info for this plenary session
            self.abstract = ''
            self.person = ''
            self.person_url = ''
            self.pdf_url = ''
            self.video_url = ''
            for session_prefix in plenary_info:
                if self.title.startswith(session_prefix):
                    (self.abstract,
                     self.person,
                     self.person_affiliation,
                     self.person_url,
                     self.pdf_url,
                     self.video_url) = plenary_info[session_prefix]
                    break

            # build the session html bit by bit
            if self.abstract:
                session_html = '<div class="session session-expandable session-plenary">'
            else:
                session_html = '<div class="session session-plenary">'

            # if we have an abstract, we need the session expander
            # next to the title
            if self.abstract:
                session_html += '<div id="expander"></div><a href="#" class="session-title">{}</a><br/>'.format(self.title)
            # otherwise, no expander, just the title; if we have a PDF
            # url (like the slides for plenary sessions) but no abstract
            # we just make an icon in the title, if we are asked to
            else:
                if pdf_icons and self.pdf_url:
                    session_html += '<span class="session-title">{}&nbsp;<i class="far fa-file-pdf paper-icon" data="{}" title="PDF"></i></span><br/>'.format(self.title, self.pdf_url)
                else:
                    session_html += '<span class="session-title">{}</span><br/>'.format(self.title)

            # if we have a person, we need to show it along with the
            # optional affiliation and the optional URL as the person's link
            if self.person:
                person_name = self.person

                if self.person_affiliation:
                    person_name += ' ({})'.format(self.person_affiliation)

                if self.person_url:
                    session_html += '<span class="session-person"><a href="{}" target="_blank">{}</a></span><br/>'.format(self.person_url, person_name)
                else:
                    session_html += '<span class="session-person">{}</span><br/>'.format(person_name)

            # add the start and end time and location no matter what
            session_html += '<span class="session-time" title="{}">{} &ndash; {}</span><br/><span class="{} btn btn--location">{}</span>'.format(str(day), self.start, self.end, location_type, self.location)

            # now add the actual abstract and the PDF and Video links
            # as icons if we have those URLs
            if self.abstract:
                session_html += '<div class="paper-session-details"><br/><div class="session-abstract"><p>{}'.format(self.abstract)
                if pdf_icons and self.pdf_url:
                    session_html += '&nbsp;<i class="far fa-file-pdf paper-icon" data="{}" title="PDF"></i>'.format(self.pdf_url)
                if video_icons and self.video_url:
                    session_html += '&nbsp;<i class="far fa-file-video video-icon" data="{}" title="Video"></i>'.format(self.video_url)
                session_html += '</p></div></div>'.format(self.abstract)

            # close off the session HTML and save it
            session_html += '</div>'
            generated_html.append(session_html)

        elif self.type == 'tutorial':

            # for tutorials, we may not have the start
            # and end times defined in the order file but we
            # need them for the website; if so just get them from
            # the first session item
            if not self.start and not self.end:
                self.start = self.items[0].start
                self.end = self.items[0].end

            generated_html.append('<div class="session session-expandable session-tutorials"><div id="expander"></div><a href="#" class="session-title">{}</a><br/><span class="session-time" title="{}">{} &ndash; {}</span><br/><div class="tutorial-session-details"><br/><table class="tutorial-table">'.format(self.title, str(day), self.start, self.end, self.location))

            # we know tutorial sessions have child items, so
            # cast those `Item` objects as `WebItem`s, call
            # their `to_html()` methods and save the results
            for item in self.items:
                item.__class__ = WebItem
                item_html = item.to_html(metadata)
                generated_html.extend(item_html)

            # add any required closing tags for valid HTML
            generated_html.extend(['</table>', '</div>', '</div>'])

        elif self.type == 'best_paper':

            # the best paper session may not have start
            # and end times defined in the order file but we
            # need them for the website; if so just get them from
            # the first and the last item
            if not self.start and not self.end:
                self.start = self.items[0].start
                self.end = self.items[-1].end

            generated_html.append('<div class="session session-plenary session-expandable session-papers-best"><div id="expander"></div><a href="#" class="session-title">{}</a><br/><span class="session-time" title="{}">{} &ndash; {}</span><br/><span class="session-location btn btn--location">{}</span><br/><div class="paper-session-details"><br/><table class="paper-table">'.format(self.title, str(day), self.start, self.end, self.location))

            # we know the best paper session has child items, so
            # cast those `Item` objects as `WebItem`s, call
            # their `to_html()` methods and save the results
            for item in self.items:
                item.__class__ = WebItem
                item_html = item.to_html(metadata,
                                         pdf_icons=pdf_icons,
                                         video_icons=video_icons)
                generated_html.extend(item_html)
            # add any required closing tags for valid HTML
            generated_html.extend(['</table>', '</div>', '</div>'])

        elif self.type == 'poster':
            generated_html.append('<div class="session session-expandable session-posters" id="session-poster-{}"><div id="expander"></div><a href="#" class="session-title">{}: {} </a><br/><span class="session-time" title="{}">{} &ndash; {}</span><br/><span class="session-location btn btn--location">{}</span><div class="poster-session-details"><br/><table class="poster-table">'.format(index, self.id_, self.title, str(day), self.start, self.end, self.location))

            # we know poster sessions have child items, so
            # cast those `Item` objects as `WebItem`s, call
            # their `to_html()` methods and save the results
            for item in self.items:
                item.__class__ = WebItem
                item_html = item.to_html(metadata,
                                         pdf_icons=pdf_icons)
                generated_html.extend(item_html)

            # add any required closing tags for valid HTML and return
            generated_html.extend(['</table>', '</div>', '</div>'])

        elif self.type == 'paper':
            session_html = '<div class="session session-expandable session-papers{}" id="session-{}"><div id="expander"></div><a href="#" class="session-title">{}: {}</a><br/><span class="session-time" title="{}">{} &ndash; {}</span><br/><span class="session-location btn btn--location">{}</span><br/><div class="paper-session-details"><br/><a href="#" class="session-selector" id="session-{}-selector"> Choose All</a><a href="#" class="session-deselector" id="session-{}-deselector">Remove All</a><table class="paper-table"><tr><td class="session-chair" colspan="2"><i title="Session Chair" class="fa fa-user"></i>: <span title="Session Chair">{}</span>'.format(index, self.id_.lower(), self.id_, self.title, str(day), self.start, self.end, self.location, self.id_.lower(), self.id_.lower(), self.chair)

            # if the session has a livetweeter assigned, display that too
            if 'tweeter' in self.extended_metadata:
                session_html += '; <i title="LiveTweeter" class="fab fa-twitter"></i>: <a href="https://twitter.com/{}" target="_blank" title="LiveTweeter">{}</a>'.format(self.extended_metadata['tweeterid'], self.extended_metadata['tweeter'])

            # close the session HTML properly
            session_html += '</td></tr>'

            # append the session HTML to the result variable
            generated_html.append(session_html)

            # we know paper sessions have child items, so
            # cast those `Item` objects as `WebItem`s, call
            # their `to_html()` methods and save the results
            for item in self.items:
                item.__class__ = WebItem
                item_html = item.to_html(metadata,
                                         pdf_icons=pdf_icons,
                                         video_icons=video_icons)
                generated_html.extend(item_html)

            # add any required closing tags for valid HTML and return
            generated_html.extend(['</table>', '</div>', '</div>'])

        return generated_html


class WebItem(Item):
    """
    Class encapsulating a presentation item for
    the website. Inherits from `orderfile.Item` and
    adds a `to_html()` method to convert the item
    into HTML for the website.

    """
    def __init__(self):
        super(WebItem, self).__init__()

    def to_html(self,
                metadata,
                pdf_icons=False,
                video_icons=False):
        """
        Convert item to HTML format compatible
        with the NAACL 2019 GitHub pages theme.

        Parameters
        ----------
        metadata : ScheduleMetadata
            An instance of `ScheduleMetadata`
            containing the title, authors,
            abstracts, and anthology URLs for
            each item, if applicable.
        pdf_icons : bool, optional
            Whether to generate the links to the
            anthology and other PDFs where appropriate.
            Defaults to `False`.
        video_icons : bool, optional
            Whether to generate the icons for
            each of the oral presentation items
            linked to the video of the talk.
            Defaults to `False`.

        Returns
        -------
        generated_html : list of str
            A list of strings containing the item HTML.

        """

        # initialize the result variable
        generated_html = []

        # generate the appropriate type of HTML depending on item type
        if self.type == 'paper':
            item_metadata = metadata.lookup(self.id_)
            self.title = item_metadata.title
            self.authors = authorlist_to_string(item_metadata.authors)
            self.pdf_url = item_metadata.pdf_url
            self.video_url = item_metadata.video_url

            # add [SRW] or [TACL] marker to title for appropriate papers
            if self.id_.endswith('-srw'):
                self.title = '[SRW] {}'.format(self.title)
            elif self.id_.endswith('-tacl'):
                self.title = '[TACL] {}'.format(self.title)

            # generate the rest of the HTML along with optional icons
            item_html = '<tr id="paper" paper-id="{}"><td id="paper-time">{}&ndash;{}</td><td><span class="paper-title">{}. </span><em>{}</em>'.format(self.id_, self.start, self.end, self.title, self.authors)
            if pdf_icons and self.pdf_url:
                item_html += '&nbsp;&nbsp;<i class="far fa-file-pdf paper-icon" data="{}" title="PDF"></i>'.format(self.pdf_url)
            if video_icons and self.video_url:
                item_html += '&nbsp;<i class="far fa-file-video video-icon" data="{}" title="Video"></i>'.format(self.video_url)
            item_html += '</td></tr>'
            generated_html.append(item_html)

        elif self.type == 'poster':
            item_metadata = metadata.lookup(self.id_)
            self.title = item_metadata.title
            self.authors = authorlist_to_string(item_metadata.authors)
            self.pdf_url = item_metadata.pdf_url

            # add [SRW] or [TACL] marker to title for appropriate papers
            if self.id_.endswith('-srw'):
                self.title = '[SRW] {}'.format(self.title)
            elif self.id_.endswith('-tacl'):
                self.title = '[TACL] {}'.format(self.title)

            # show the poster number if available
            if 'poster_number' in self.extended_metadata:
                self.title = '#{}: {}'.format(self.extended_metadata['poster_number'],
                                              self.title)

            # display the poster topic if encounter one
            if self.topic:
                generated_html.append('<tr><td><span class="poster-type">{}</span></td></tr>'.format(self.topic))
            item_html = '<tr id="poster" poster-id="{}"><td><span class="poster-title">{}. </span><em>{}</em>'.format(self.id_, self.title, self.authors)

            # display an optional icon
            if pdf_icons and self.pdf_url:
                item_html += '&nbsp;&nbsp;<i class="far fa-file-pdf paper-icon" data="{}" title="PDF"></i>'.format(self.pdf_url)
            item_html += '</td></tr>'
            generated_html.append(item_html)

        elif self.type == 'tutorial':
            item_metadata = metadata.lookup(self.id_)
            self.title = item_metadata.title
            self.authors = authorlist_to_string(item_metadata.authors)
            generated_html.append('<tr id="tutorial"><td><span class="tutorial-title"><strong>{}. </strong>{}. </span><br/><span class="btn btn--location inline-location">{}</span></td></tr>'.format(self.title, self.authors, self.location))

        # return the generated item HTML
        return generated_html


def main():

    # set up an argument parser
    parser = argparse.ArgumentParser(prog='generate.py')
    parser.add_argument("config_file",
                        help="Input JSON file containing "
                             "the web schedule configuration")
    parser.add_argument("output_file",
                        help="Output markdown file")

    # parse given command line arguments
    args = parser.parse_args()

    # set up the logging
    logging.basicConfig(format='%(levelname)s - %(message)s', level=logging.INFO)

    # parse the configuration file
    with open(args.config_file, 'r') as configfh:
        config = json.loads(configfh.read())

    # parse the orderfile into a `WebAgenda` object
    # for the main conference
    logging.info('Parsing order file ...')
    wa = WebAgenda('main')
    wa.fromfile(config['order_file'])

    # parse the metadata files
    logging.info('Parsing metadata files ...')
    extra_metadata_file = config.get('extra_metadata_file', None)
    metadata = ScheduleMetadata.fromfiles(xmls=[config['xml_file']],
                                          mappings={'main': config['mapping_file']},
                                          extra_metadata_files={'main': extra_metadata_file} if extra_metadata_file else {})

    # parse and store any additional plenary session
    # info if provided
    plenary_info_dict = {}
    if 'plenary_info_file' in config:
        logging.info("Parsing plenary info file ...")
        with open(config['plenary_info_file'], 'r') as plenaryfh:
            reader = csv.DictReader(plenaryfh, dialect=csv.excel_tab)
            for row in reader:
                key = row['session'].strip()
                value = (row['abstract'].strip(),
                         row['person'].strip(),
                         row['person_affiliation'].strip(),
                         row['person_url'].strip(),
                         row['pdf_url'].strip(),
                         row['video_url'].strip())
                plenary_info_dict[key] = value

    # convert WebAgenda to HTML
    logging.info("Converting parsed agenda to HTML ...")
    html = wa.to_html(metadata,
                      pdf_icons=config.get('pdf_icons', False),
                      video_icons=config.get('video_icons', False),
                      plenary_info=plenary_info_dict)

    # add the Jekyll frontmatter
    logging.info("Adding Jekyll frontmatter ...")
    frontmatter = open(_THIS_DIR / 'frontmatter.md', 'r').read()
    final_page_content = '\n'.join([frontmatter, html])

    # write out the content to the output file
    logging.info('Writing content to output file ...')
    with open(args.output_file, 'w') as outputfh:
        outputfh.write(final_page_content)


if __name__ == '__main__':
    main()
