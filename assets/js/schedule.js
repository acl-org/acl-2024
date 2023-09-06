/**
 * Copyright (c) 2019
 *
 * Code that powers the customized
 * schedule generation for NAACL 2019
 * website. Allows a user to expand/collapse
 * parallel sessions, examine conflicting
 * talks, choose the desired ones, and generate
 * a PDF of their customized agenda.
 *
 * @summary Code for NAACL 2019 official website schedule.
 * @author Nitin Madnani (nmadnani@ets.org)
 *
 * This code is licensed under the MIT license.
 * https://opensource.org/licenses/MIT
 */

 /*********************************************************
  * The main idea behind this code is as follows:
  * on page load, each session, paper and poster, etc. are
  * parsed and put into various hashes. Then as papers, 
  * posters are clicked etc. they are added to another set 
  * of "chosen" hashes. When the download PDF button is 
  * clicked, a hidden program HTML table is populated with
  * all the chosen items along with all of the plenary 
  * sessions if the checkbox is enabled. Finally, the jsPDF
  * autotable plugin is used to convert that hidden table 
  * into a PDF. 
  **********************************************************/


/* initialize some global variables we need */
sessionInfoHash = {};
paperInfoHash = {};
chosenPapersHash = {};
chosenTutorialsHash = {};
chosenWorkshopsHash = {};
chosenPostersHash = {};
plenarySessionHash = {};
includePlenaryInSchedule = true;
helpShown = false;

/* the help text to show */
var instructions = "<div id=\"popupInstructionsDiv\"><div id=\"title\">Help</div><div id=\"popupInstructions\"><ul><li>Click on a the \"<strong>+</strong>\" button or the title of a session to toggle it. Click the <strong>\"Expand All Sessions ↓\"</strong> button to expand <em>all</em> sessions in one go. Click again to collapse them. </li> <li>Click on a tutorial/paper/poster to toggle its selection. </li> <li>You can select more than one paper for a time slot. </li> <li>Icon glossary: <i class=\"far fa-file-pdf\"></i> = PDF, <i class=\"far fa-file-video\"></i> = Video, <i class=\"fa fa-user\"></i> = Session Chair, <i class=\"fab fa-twitter\"></i> = LiveTweeter. </li> <li>Click the <strong>\"Download PDF\"</strong> button at the bottom to download your customized PDF. </li> <li>To expand parallel sessions simultaneously, hold Shift and click on any of them. </li> <li>On non-mobile devices, hovering on a paper for a time slot highlights it in yellow and its conflicting papers in red. Hovering on papers already selected for a time slot (or their conflicts) highlights them in green. </li> <li>Hover over the time for any session to see its day and date as a tooltip.</li> <li>While saving the generated PDF on mobile devices, its name cannot be changed.</li> </ul></div></div>";

/* function to pad with zeros */
function padTime(str) {
    return String('0' + str).slice(-2);
}

/* function to format date strings */
function formatDate(dateObj) {
    return dateObj.toLocaleDateString() + ' ' + padTime(dateObj.getHours()) + ':' + padTime(dateObj.getMinutes());
}

/* function that generates the PDF table */
function generatePDFfromTable() {

    /* clear the hidden table before starting */
    clearHiddenProgramTable();

    /* now populate the hidden table with the currently chosen papers */
    populateHiddenProgramTable();

    /* set up the autotable plugin */
    var doc = new jsPDF('l', 'pt', 'letter');
    doc.autoTable({
        html: "#hidden-program-table",
        pagebreak: 'avoid',
        avoidRowSplit: true,
        theme: 'grid',
        startY: 70, 
        showHead: false,
        styles: {
            font: 'times',
            overflow: 'linebreak',
            valign: 'middle',
            lineWidth: 0.4,
            fontSize: 11
        },
        columnStyles: {
            0: { fontStyle: 'bold', halign: 'right', cellWidth: 70 },
            1: { cellWidth: 110 },
            2: { fontStyle: 'italic', cellWidth: 530 }
        },
        didDrawPage: function (data) {
            /* HEADER only on the first page */
            var pageNumber = doc.internal.getCurrentPageInfo().pageNumber;
            if (pageNumber == 1) {
                doc.setFontSize(16);
                doc.setFontStyle('normal');
                doc.text("NAACL 2019 Schedule", (doc.internal.pageSize.width - (data.settings.margin.left*2))/2 - 30, 50);
            }

            /* FOOTER on each page */
            doc.setFont('courier');
            doc.setFontSize(8);
            doc.text('(Generated via https://naacl2019.org/schedule)', data.settings.margin.left, doc.internal.pageSize.height - 10);
        },
        didDrawCell: function(data) {
            /* split long plenary session text */
            if (data.row.section == 'body') {
                var cellClass = data.cell.raw.className;
                if (cellClass == 'info-plenary') {
                    data.cell.text = doc.splitTextToSize(data.cell.text.join(' '), 530, {fontSize: 11});
                }         
            }
        },
        willDrawCell: function(data) {
            /* center the day header */
            if (data.row.section == 'body') {
                var cellClass = data.cell.raw.className;
                if (cellClass == 'info-day') {
                    data.cell.textPos.x = (530 - data.settings.margin.left)/2 + 120;
                }                
            }
        },
        didParseCell: function(data) {
            /* write day headers in bold text with dark gray background */
            if (data.row.section == 'body') {
                var cellClass = data.cell.raw.className;
                var cellText = data.cell.text[0];
                if (cellClass == 'info-day') {
                    data.cell.styles.fontStyle = 'bold';
                    data.cell.styles.fontSize = 12;
                    data.cell.styles.fillColor = [187, 187, 187];
                }
                /* mark breaks explicitly with a different color */
                else if (cellClass == 'info-plenary') {
                    data.cell.styles.fontSize = 11;
                    if (cellText.search(/break|lunch|breakfast/i) !== -1) {
                        data.cell.styles.fillColor = [238, 238, 238];
                    }
                }
                /* make poster titles smaller than usual */
                else if (cellClass == 'info-poster') {
                    data.cell.styles.fontSize = 9;
                }
                /* fill the other empty cells with appropriate colors if we have breaks or day headers */
                else if (cellClass == "location" || cellClass == "time") {
                    var rowCells = data.row.raw.cells;
                    var infoType = rowCells[rowCells.length-1].className;
                    var infoText = rowCells[rowCells.length-1].textContent;
                    if (infoType == "info-day" && cellText == '') {
                        data.cell.styles.fillColor = [187, 187, 187];
                    }
                    if (infoType == "info-plenary" && 
                        infoText.search(/(break|lunch|breakfast)/i) !== -1) {
                        data.cell.styles.fillColor = [238, 238, 238];
                    }
                }                
            }
        },
    });
    doc.output('save', 'schedule.pdf');
}

function getTutorialInfoFromTime(tutorialTimeObj) {

    /* get the tutorial session and day */
    var tutorialSession = tutorialTimeObj.parents('.session');
    var sessionDay = tutorialSession.prevAll('.day:first').text().trim();

    /* get the tutorial slot and the starting and ending times */
    var tutorialTimeText = tutorialTimeObj.text().trim();
    var tutorialTimes = tutorialTimeText.split(' ');
    var tutorialSlotStart = tutorialTimes[0];
    var tutorialSlotEnd = tutorialTimes[2];
    var exactTutorialStartingTime = sessionDay + ' ' + tutorialSlotStart;
    return [new Date(exactTutorialStartingTime).getTime(), tutorialSlotStart, tutorialSlotEnd, tutorialSession.attr('id')];
}

function getWorkshopInfoFromTime(workshopTimeObj) {

    /* get the workshop session and day */
    var workshopSession = workshopTimeObj.parents('.session');
    var sessionDay = workshopSession.prevAll('.day:first').text().trim();

    /* get the workshop slot and the starting and ending times */
    var workshopTimeText = workshopTimeObj.text().trim();
    var workshopTimes = workshopTimeText.split(' ');
    var workshopSlotStart = workshopTimes[0];
    var workshopSlotEnd = workshopTimes[2];
    var exactworkshopStartingTime = sessionDay + ' ' + workshopSlotStart;
    return [new Date(exactworkshopStartingTime).getTime(), workshopSlotStart, workshopSlotEnd, workshopSession.attr('id')];
}

function getPosterInfoFromTime(posterTimeObj) {

    /* get the poster session and day */
    var posterSession = posterTimeObj.parents('.session');
    var sessionDay = posterSession.parent().prevAll('.day:first').text().trim();

    /* get the poster slot and the starting and ending times */
    var posterTimeText = posterTimeObj.text().trim();
    var posterTimes = posterTimeText.split(' ');
    var posterSlotStart = posterTimes[0];
    var posterSlotEnd = posterTimes[2];
    var exactPosterStartingTime = sessionDay + ' ' + posterSlotStart;
    return [new Date(exactPosterStartingTime).getTime(), posterSlotStart, posterSlotEnd, posterSession.attr('id')];
}

function isOverlapping(thisPaperRange, otherPaperRange) {
    var thisStart = thisPaperRange[0];
    var thisEnd = thisPaperRange[1];
    var otherStart = otherPaperRange[0];
    var otherEnd = otherPaperRange[1];
    return ((thisStart < otherEnd) && (thisEnd > otherStart));
}

function getConflicts(paperObject) {

    /* first get the parallel sessions */
    var sessionId = paperObject.parents('.session').attr('id').match(/session-\d/)[0];
    var parallelSessions = paperObject.parents('.session').siblings().filter(function() { return this.id.match(sessionId); });
    
    var thisPaperRange = paperInfoHash[paperObject.attr('paper-id')].slice(0, 2);
    return $(parallelSessions).find('table.paper-table tr#paper').filter(function(index) {
            var otherPaperRange =  paperInfoHash[$(this).attr('paper-id')].slice(0, 2);
            return isOverlapping(thisPaperRange, otherPaperRange) 
        });
}

function doWhichKey(e) {
    e = e || window.event;
    var charCode = e.keyCode || e.which;
    //Line below not needed, but you can read the key with it
    //var charStr = String.fromCharCode(charCode);
    return charCode;
}

function makeDayHeaderRow(day) {
    return '<tr><td class="time"></td><td class="location"></td><td class="info-day">' + day + '</td></tr>';
}

function makePlenarySessionHeaderRow(session) {
    var sessionStart = session.start;
    var sessionEnd = session.end;
    return '<tr><td class="time">' + sessionStart + '&ndash;' + sessionEnd + '</td><td class="location">' + session.location + '</td><td class="info-plenary">' + session.title + '</td></tr>';
}

function makePaperRows(start, end, titles, sessions) {
    var ans;
    if (titles.length == 1) {
        ans = ['<tr><td class="time">' + start + '&ndash;' + end + '</td><td class="location">' + sessions[0].location + '</td><td class="info-paper">' + titles[0] + ' [' + sessions[0].title + ']</td></tr>'];
    }
    else {
        var numConflicts = titles.length;
        rows = ['<tr><td rowspan=' + numConflicts + ' class="time">' + start + '&ndash;' + end + '</td><td class="location">' + sessions[0].location + '</td><td class="info-paper">' + titles[0] + ' [' + sessions[0].title + ']</td></tr>'];
        for (var i=1; i<numConflicts; i++) {
            var session = sessions[i];
            var title = titles[i];
            rows.push('<tr><td class="location">' + session.location + '</td><td class="info-paper">' + title + ' [' + session.title + ']</td></tr>')
        }
        ans = rows;
    }
    return ans;
}

function makeTutorialRows(start, end, titles, locations, sessions) {
    var ans;
    if (titles.length == 1) {
        ans = ['<tr><td class="time">' + start + '&ndash;' + end + '</td><td class="location">' + locations[0] + '</td><td class="info-paper">' + titles[0] + ' [' + sessions[0].title + ']</td></tr>'];
    }
    else {
        var numConflicts = titles.length;
        rows = ['<tr><td rowspan=' + numConflicts + ' class="time">' + start + '&ndash;' + end + '</td><td class="location">' + locations[0] + '</td><td class="info-paper">' + titles[0] + ' [' + sessions[0].title + ']</td></tr>'];
        for (var i=1; i<numConflicts; i++) {
            var session = sessions[i];
            var title = titles[i];
            var location = locations[i];
            rows.push('<tr><td class="location">' + location + '</td><td class="info-paper">' + title + ' [' + session.title + ']</td></tr>')
        }
        ans = rows;
    }
    return ans;
}

function makeWorkshopRows(start, end, titles, locations, sessions) {
    var ans;
    if (titles.length == 1) {
        ans = ['<tr><td class="time">' + start + '&ndash;' + end + '</td><td class="location">' + locations[0] + '</td><td class="info-paper">' + titles[0] + ' [' + sessions[0].title + ']</td></tr>'];
    }
    else {
        var numConflicts = titles.length;
        rows = ['<tr><td rowspan=' + numConflicts + ' class="time">' + start + '&ndash;' + end + '</td><td class="location">' + locations[0] + '</td><td class="info-paper">' + titles[0] + ' [' + sessions[0].title + ']</td></tr>'];
        for (var i=1; i<numConflicts; i++) {
            var session = sessions[i];
            var title = titles[i];
            var location = locations[i];
            rows.push('<tr><td class="location">' + location + '</td><td class="info-paper">' + title + ' [' + session.title + ']</td></tr>')
        }
        ans = rows;
    }
    return ans;
}

function makePosterRows(titles, types, sessions) {
    var numPosters = titles.length;
    var sessionStart = sessions[0].start;
    var sessionEnd = sessions[0].end;
    rows = ['<tr><td rowspan=' + (numPosters + 1) + ' class="time">' + sessionStart + '&ndash;' + sessionEnd + '</td><td rowspan=' + (numPosters + 1) + ' class="location">' + sessions[0].location + '</td><td class="info-paper">' + sessions[0].title +  '</td></tr>'];
    for (var i=0; i<numPosters; i++) {
        var title = titles[i];
        var type = types[i];
        rows.push('<tr><td class="info-poster">' + title + '</td></tr>');
    }
    return rows;
}

function clearHiddenProgramTable() {
    $('#hidden-program-table tbody').html('');
}

function getChosenHashFromType(type) {
    var chosenHash;
    if (type == 'paper') {
        chosenHash = chosenPapersHash;
    }
    else if (type == 'tutorial') {
        chosenHash = chosenTutorialsHash;
    }
    else if (type == 'workshop') {
        chosenHash = chosenWorkshopsHash;
    }
    else if (type == 'poster') {
        chosenHash = chosenPostersHash;
    }
    return chosenHash;
}

function addToChosen(timeKey, item, type) {
    var chosenHash = getChosenHashFromType(type);
    if (timeKey in chosenHash) {
        var items = chosenHash[timeKey];
        items.push(item);
        chosenHash[timeKey] = items;
    }
    else {
        chosenHash[timeKey] = [item];
    }
}

function removeFromChosen(timeKey, item, type) {
    var chosenHash = getChosenHashFromType(type);            
    if (timeKey in chosenHash) {
        var items = chosenHash[timeKey];
        var itemIndex = items.map(function(item) { return item.title; }).indexOf(item.title);
        if (itemIndex !== -1) {
            var removedItem = items.splice(itemIndex, 1);
            delete removedItem;
            if (items.length == 0) {
                delete chosenHash[timeKey];
            }
            else {
                chosenHash[timeKey] = items;
            }
        }
    }
}

function isChosen(timeKey, item, type) {
    var ans = false;
    var chosenHash = getChosenHashFromType(type);
    if (timeKey in chosenHash) {
        var items = chosenHash[timeKey];
        var itemIndex = items.map(function(item) { return item.title; }).indexOf(item.title);
        ans = itemIndex !== -1;
    }
    return ans;
}

function toggleSession(sessionObj) {
    $(sessionObj).children('[class$="-details"]').slideToggle(300);
    $(sessionObj).children('#expander').toggleClass('expanded');
}

function openSession(sessionObj) {
    $(sessionObj).children('[class$="-details"]').slideDown(300);
    $(sessionObj).children('#expander').addClass('expanded');
}

function closeSession(sessionObj) {
    $(sessionObj).children('[class$="-details"]').slideUp(300);
    $(sessionObj).children('#expander').removeClass('expanded');
}

function populateHiddenProgramTable() {

    /* since papers and posters might start at the same time we cannot just rely on starting times to differentiate papers vs. posters. so, what we can do is just add an item type after we do the concatenation and then rely on that item type to distinguish the item */
    
    var nonPlenaryKeysAndTypes = [];
    var tutorialKeys = Object.keys(chosenTutorialsHash);
    var workshopKeys = Object.keys(chosenWorkshopsHash);
    var posterKeys = Object.keys(chosenPostersHash);
    var paperKeys = Object.keys(chosenPapersHash);
    for (var i=0; i < tutorialKeys.length; i++) {
        nonPlenaryKeysAndTypes.push([tutorialKeys[i], 'tutorial']);
    }
    for (var i=0; i < workshopKeys.length; i++) {
        nonPlenaryKeysAndTypes.push([workshopKeys[i], 'workshop']);
    }
    for (var i=0; i < posterKeys.length; i++) {
        nonPlenaryKeysAndTypes.push([posterKeys[i], 'poster']);
    }
    for (var i=0; i < paperKeys.length; i++) {
        nonPlenaryKeysAndTypes.push([paperKeys[i], 'paper']);
    }

    var plenaryKeys = Object.keys(plenarySessionHash);
    var plenaryKeysAndTypes = [];
    for (var i=0; i < plenaryKeys.length; i++) {
        plenaryKeysAndTypes.push([plenaryKeys[i], 'plenary']);
    }

    /* if we are including plenary information in the PDF then sort its keys too and merge the two sets of keys together before sorting */
    var sortedPaperTimes = includePlenaryInSchedule ? nonPlenaryKeysAndTypes.concat(plenaryKeysAndTypes) : nonPlenaryKeysAndTypes;
    sortedPaperTimes.sort(function(a, b) { return a[0] - b[0] });

    /* now iterate over these sorted papers and create the rows for the hidden table that will be used to generate the PDF */
    var prevDay = null;
    var latestEndingTime;
    var output = [];

    /* now iterate over the chosen items */
    for(var i=0; i<sortedPaperTimes.length; i++) {
        var keyAndType = sortedPaperTimes[i];
        var key = keyAndType[0];
        var itemType = keyAndType[1]
        /* if it's a plenary session */
        if (itemType == 'plenary') {
            var plenarySession = plenarySessionHash[key];
            if (plenarySession.day == prevDay) {
                output.push(makePlenarySessionHeaderRow(plenarySession));
            }
            else {
                output.push(makeDayHeaderRow(plenarySession.day));
                output.push(makePlenarySessionHeaderRow(plenarySession));
            }
            prevDay = plenarySession.day;
        }
        /* if it's tutorials */
        else if (itemType == 'tutorial') {

            /* get the tutorials */
            var tutorials = chosenTutorialsHash[key];

            /* sort the tutorials by title instead of selection order */
            tutorials.sort(function(a, b) {
                return a.title.localeCompare(b.title);
            });

            var titles = tutorials.map(function(tutorial) { return ASCIIFold(tutorial.title); });
            var locations = tutorials.map(function(tutorial) { return tutorial.location ; });
            var sessions = tutorials.map(function(tutorial) { return sessionInfoHash[tutorial.session]; });
            var sessionDay = sessions[0].day;
            if (sessionDay != prevDay) {
                output.push(makeDayHeaderRow(sessionDay));
            }
            output = output.concat(makeTutorialRows(tutorials[0].start, tutorials[0].end, titles, locations, sessions));
            prevDay = sessionDay;
        }
        /* if it's workshops */
        else if (itemType == 'workshop') {

            /* get the workshops */
            var workshops = chosenWorkshopsHash[key];

            /* sort the workshops by title instead of selection order */
            workshops.sort(function(a, b) {
                return a.title.localeCompare(b.title);
            });

            var titles = workshops.map(function(workshop) { return ASCIIFold(workshop.title); });
            var locations = workshops.map(function(workshop) { return workshop.location ; });
            var sessions = workshops.map(function(workshop) { return sessionInfoHash[workshop.session]; });
            var sessionDay = sessions[0].day;
            if (sessionDay != prevDay) {
                output.push(makeDayHeaderRow(sessionDay));
            }
            output = output.concat(makeWorkshopRows(workshops[0].start, workshops[0].end, titles, locations, sessions));
            prevDay = sessionDay;
        }
        /* if it's posters */
        else if (itemType == 'poster') {

            /* get the posters */
            var posters = chosenPostersHash[key];

            /* sort posters by their type for easier reading */
            posters.sort(function(a, b) {
                return a.type.localeCompare(b.type);
            });
            var titles = posters.map(function(poster) { return ASCIIFold(poster.title); });
            var types = posters.map(function(poster) { return poster.type; });
            var sessions = [sessionInfoHash[posters[0].session]];
            var sessionDay = sessions[0].day;
            if (sessionDay != prevDay) {
                output.push(makeDayHeaderRow(sessionDay));
            }
            output = output.concat(makePosterRows(titles, types, sessions));
            prevDay = sessionDay;
        }

        /* if it's papers  */
        else if (itemType == 'paper') {
            var papers = chosenPapersHash[key];
            /* sort papers by location for easier reading */
            papers.sort(function(a, b) {
                var aLocation = sessionInfoHash[a.session].location;
                var bLocation = sessionInfoHash[b.session].location;
                return aLocation.localeCompare(bLocation);
            });
            var titles = papers.map(function(paper) { return ASCIIFold(paper.title); });
            var sessions = papers.map(function(paper) { return sessionInfoHash[paper.session]; });
            var sessionDay = sessions[0].day;
            if (sessionDay != prevDay) {
                output.push(makeDayHeaderRow(sessionDay));
            }
            output = output.concat(makePaperRows(papers[0].start, papers[0].end, titles, sessions));
            prevDay = sessionDay;
        }
    }

    /* append the output to the hidden table */
    $('#hidden-program-table tbody').append(output);
}

/* main jquery code starts here */
$(document).ready(function() {
    
    /* all the Remove All buttons are disabled on startup */
    $('.session-deselector').addClass('disabled');

    /* the include plenary checkbox is checked on startup */
    $('input#includePlenaryCheckBox').prop('checked', true);

    /* show the help window whenever "?" is pressed and close it when "Esc" is pressed */
    $(document).keypress(function(event) {
        if (doWhichKey(event) == 63 && !helpShown) {
            helpShown = true;
            alertify.alert('', instructions, function(event) { helpShown = false;}).set('transition', 'fade');
        }
    });

    /* show the help window when the help button is clicked */
    $('a#help-button').on('click', function (event) {
        if (!helpShown) {
            event.stopPropagation();
            event.preventDefault();
            helpShown = true;
            alertify.alert('', instructions, function(event) { helpShown = false;}).set('transition', 'fade');
        }
    });

    /* expand/collapse all sessions when the toggle button is clicked */
    $('a#toggle-all-button').on('click', function (event) {
        event.stopPropagation();
        event.preventDefault();
        var buttonText = $(this).text();

        / * expand all collapsed sessions */
        if (buttonText == 'Expand All Sessions ↓') {
            $('div#expander').not('.expanded').trigger('click');
            $(this).text('Collapse All Sessions ↑');
        }
        /* collapse all expanded sessions */
        else {
            $('div#expander.expanded').trigger('click');
            $(this).text('Expand All Sessions ↓');
        }
    });

    /* if the location is an external one, open it in google maps */
    $('span.session-external-location').on('click', function(event) {
        var placeName = $(this).text().trim().replace(" ", "+");
        window.open("https://www.google.com/maps?q=" + placeName, "_blank");
        event.stopPropagation();
    });

    /* show the floorplan when any location is clicked */
    $('span.session-location, span.inline-location').on('click', function(event) {
        event.stopPropagation();
    });
    $('span.session-location, span.inline-location').magnificPopup({
        items: {
            src: '/assets/images/minneapolis/3d-floormap.png'
        },
        type: 'image',
        fixedContentPos: 'auto'
    });

    /* get all the tutorial sessions and save the day and location for each of them in a hash */
    $('.session-tutorials').each(function() {
        var session = {};
        session.title = $(this).children('.session-title').text().trim();
        session.day = $(this).prevAll('.day:first').text().trim();
        sessionInfoHash[$(this).attr('id')] = session;
    });

    /* get all the workshop sessions and save the day and location for each of them in a hash */
    $('.session-workshops').each(function() {
        var session = {};
        session.title = $(this).children('.session-title').text().trim();
        session.day = $(this).prevAll('.day:first').text().trim();
        sessionInfoHash[$(this).attr('id')] = session;
    });

    /* get all the poster sessions and save the day and location for each of them in a hash */
    $('.session-posters').each(function() {
        var session = {};
        session.title = $(this).children('.session-title').text().trim();
        session.day = $(this).parent().prevAll('.day:first').text().trim();
        session.location = $(this).children('span.session-location').text().trim();
        var sessionTimeText = $(this).children('span.session-time').text().trim();                
        var sessionTimes = sessionTimeText.match(/\d+:\d+/g);
        var sessionStart = sessionTimes[0];
        var sessionEnd = sessionTimes[1];
        session.start = sessionStart;
        session.end = sessionEnd;
        sessionInfoHash[$(this).attr('id')] = session;
    });

    /* get all the paper sessions and save the day and location for each of them in a hash */
    var paperSessions = $("[id|='session']").filter(function() { 
        return this.id.match(/session-\d\d?[a-z]$/);
    });
    $(paperSessions).each(function() {
        var session = {};
        session.title = $(this).children('.session-title').text().trim();
        session.location = $(this).children('span.session-location').text().trim();
        session.day = $(this).parent().prevAll('.day:first').text().trim();
        var sessionTimeText = $(this).children('span.session-time').text().trim();                
        var sessionTimes = sessionTimeText.match(/\d+:\d+/g);
        var sessionStart = sessionTimes[0];
        var sessionEnd = sessionTimes[1];
        session.start = sessionStart;
        session.end = sessionEnd;
        sessionInfoHash[$(this).attr('id')] = session;
    });

    /* iterate over all the papers and store all their info in a hash since we need that info whenever we click and hover and lookups will be faster than re-computing the info at each event */
    $('tr#paper').each(function() {
        var paperID = $(this).attr('paper-id');

        /* get the paper session and day */
        var paperSession = $(this).parents('.session');
        var sessionDay = paperSession.parent().prevAll('.day:first').text().trim();

        /* get the paper time and title */
        var paperTimeObj = $(this).children('#paper-time');
        var paperTitle = paperTimeObj.siblings('td').text().trim().replace(/\s\s+/g, " ");

        /* get the paper slot and the starting and ending times */
        var paperTimeText = paperTimeObj.text().trim();
        var paperTimes = paperTimeText.split('\u2013');
        var paperSlotStart = paperTimes[0];
        var paperSlotEnd = paperTimes[1];
        var exactPaperStartingTime = sessionDay + ' ' + paperSlotStart;
        var exactPaperEndingTime = sessionDay + ' ' + paperSlotEnd;

        paperInfoHash[paperID] = [new Date(exactPaperStartingTime).getTime(), new Date(exactPaperEndingTime).getTime(), paperSlotStart, paperSlotEnd, paperTitle, paperSession.attr('id')];
    });

    /* also save the plenary session info in another hash since we may need to add this to the pdf. Use the exact starting time as the hash key */
     $('.session-plenary').each(function() {
        var session = {};
        session.title = $(this).children('.session-title').text().trim();
        if (session.title == "Social Event") {
            session.location = $(this).children('span.session-external-location').text().trim();
        }
        else {
            session.location = $(this).children('span.session-location').text().trim();                    
        }
        session.day = $(this).prevAll('.day:first').text().trim();
        session.id = $(this).attr('id');
        var sessionTimeText = $(this).children('span.session-time').text().trim();
        var sessionTimes = sessionTimeText.match(/\d+:\d+/g);
        var sessionStart = sessionTimes[0];
        var sessionEnd = sessionTimes[1];
        session.start = sessionStart;
        session.end = sessionEnd;
        var exactSessionStartingTime = session.day + ' ' + sessionStart;
        plenarySessionHash[new Date(exactSessionStartingTime).getTime()] = session;
     });

    /* select a session */
    $('body').on('click', 'a.session-selector', function(event) {

        /* if we are disabled, do nothing */
        if ($(this).hasClass('disabled')) {
            return false;
        }

        /* if we are choosing the entire session, then basically "click" on all of the not-selected papers */
        var sessionPapers = $(this).siblings('table.paper-table').find('tr#paper');
        var unselectedPapers = sessionPapers.not('.selected');
        unselectedPapers.trigger('click', true);

        /* now find out how many papers are selected after the trigger */
        var selectedPapers = sessionPapers.filter('.selected');

        /* disable myself (the choose all button) */
        $(this).addClass('disabled');

        /* if we didn't have any papers selected earlier, then enable the remove all button */
        if (unselectedPapers.length == sessionPapers.length) {
            $(this).siblings('.session-deselector').removeClass('disabled');
        }

        /* this is not really a link */
        event.preventDefault();
        return false;
    });

    /* deselect a session */
    $('body').on('click', 'a.session-deselector', function(event) {

        /* if we are disabled, do nothing */
        if ($(this).hasClass('disabled')) {
            return false;
        }

        /* otherwise, if we are removing the entire session, then basically "click" on all of the already selected papers */
        var sessionPapers = $(this).siblings('table.paper-table').find('tr#paper');
        var selectedPapers = sessionPapers.filter('.selected');
        selectedPapers.trigger('click', true);

        /* disable myself (the remove all button) */
        $(this).addClass('disabled');

        /* enable the choose all button */
        $(this).siblings('session-deselector').removeClass('disabled');

        /* if all the papers were selected earlier, then enable the choose all button */
        if (selectedPapers.length == sessionPapers.length) {
            $(this).siblings('.session-selector').removeClass('disabled');                    
        }

        /* this is not really a link */
        event.preventDefault();
        return false;
    });

    /* hide all of the session details when starting up */
    $('[class$="-details"]').hide();

    /* expand sessions when their title is clicked */
    $('body').on('click', 'div.session-expandable .session-title, div#expander', function(event) {
        event.preventDefault();
        event.stopPropagation();
        var sessionObj = $(this).parent();

        /* if we had the shift key pressed, then expand ALL unexpanded parallel sessions including myself (only for papers) */
        if (event.shiftKey && sessionObj.attr('class').match('session-papers')) {
            var sessionId = $(sessionObj).attr('id').match(/session-\d/)[0];
            var parallelSessions = $(sessionObj).siblings().addBack().filter(function() { return this.id.match(sessionId); });

            var unexpandedParallelSessions = $(parallelSessions).filter(function() { return !$(this).children('#expander').hasClass('expanded'); });

            /* if all sessions are already expanded, then shift-clicking should close all of them */
            if (unexpandedParallelSessions.length == 0) {
                $.map(parallelSessions, closeSession);
            }
            else {
                $.map(unexpandedParallelSessions, openSession);
            }
        } 
        /* for a regular click, just toggle the individual session */
        else {
            toggleSession(sessionObj);
        }
    });

    /* when we mouse over a paper icon, do not do anything */
    $('body').on('mouseover', 'table.paper-table tr#paper svg[class$="-icon"]', function(event) {
        return false;
    });

    /* when we mouse over a paper, highlight the conflicting papers */
    $('body').on('mouseover', 'div.session-expandable[id] table.paper-table tr#paper', function(event) {
        var conflictingPapers = getConflicts($(this));
        $(this).addClass('hovered');
        $(conflictingPapers).addClass('conflicted');
    });

    /* when we mouse out, remove all highlights */
    $('body').on('mouseout', 'div.session-expandable[id] table.paper-table tr#paper', function(event) {
        var conflictingPapers = getConflicts($(this));
        $(this).removeClass('hovered');
        $(conflictingPapers).removeClass('conflicted');

    });

    /* disable some events from propagating */
    $('body').on('click', 'a.info-button', function(event) {
        return false;
    });

    $('body').on('click', 'a.info-link', function(event) {
        event.stopPropagation();
    });

    $('body').on('click', 'div.session-abstract', function(event) {
        event.stopPropagation();
    });

    $('body').on('click', 'table.paper-table', function(event) {
        event.stopPropagation();
    });

    $('body').on('click', 'table.tutorial-table', function(event) {
        event.stopPropagation();
    });

    $('body').on('click', 'table.poster-table', function(event) {
        event.stopPropagation();
    });

    $('body').on('click', 'div.paper-session-details', function(event) {
        event.stopPropagation();
    });

    /* toggle the inclusion of plenary sessions in the PDF */
    $('body').on('click', 'input#includePlenaryCheckBox', function(event) {
            includePlenaryInSchedule = $(this).prop('checked');
    });

    /* when we click on the "Download PDF" button ... */
    $('body').on('click', 'a#generatePDFButton', function(event) {
        /* if we haven't chosen any papers, and we aren't including plenary sessions either, then raise an error. If we are including plenary sessions and no papers, then confirm. */
        event.stopPropagation();
        event.preventDefault();
        var numChosenItems = Object.keys(chosenPapersHash).length + Object.keys(chosenTutorialsHash).length + Object.keys(chosenWorkshopsHash).length + Object.keys(chosenPostersHash).length;
        if (numChosenItems == 0) {
            if (includePlenaryInSchedule) {
                alertify.confirm('', 'The PDF will contain only the plenary sessions since nothing was chosen. Proceed?', function () { generatePDFfromTable();
                        }, function() { }).setting({'transition': 'fade', 'defaultFocus': 'cancel'});
            }
            else {
                alertify.alert('', 'Nothing to generate. Nothing was chosen and plenary sessions were excluded.').set('transition', 'fade');
                return false;
            }
        }
        else {
            generatePDFfromTable();
        }
    });

    /* when we click on a tutorial ... */
    $('body').on('click', 'table.tutorial-table tr#tutorial', function(event) {
        event.preventDefault();
        var tutorialTimeObj = $(this).parents('.session-tutorials').children('.session-time');
        var tutorialInfo = getTutorialInfoFromTime(tutorialTimeObj);
        var tutorialObject = {};
        var exactStartingTime = tutorialInfo[0];
        tutorialObject.start = tutorialInfo[1];
        tutorialObject.end = tutorialInfo[2];
        tutorialObject.title = $(this).find('.tutorial-title').text();
        tutorialObject.session = tutorialInfo[3];
        tutorialObject.location = $(this).find('.inline-location').text();
        tutorialObject.exactStartingTime = exactStartingTime;

        /* if we are clicking on an already selected tutorial */
        if (isChosen(exactStartingTime, tutorialObject, 'tutorial')) {
            $(this).removeClass('selected');
            removeFromChosen(exactStartingTime, tutorialObject, 'tutorial');
        }
        else {
            addToChosen(exactStartingTime, tutorialObject, 'tutorial');
            $(this).addClass('selected');                    
        }
    });

    /* when we click on a workshop ... */
    $('body').on('click', 'table.workshop-table tr#workshop', function(event) {
        event.preventDefault();
        var workshopTimeObj = $(this).parents('.session-workshops').children('.session-time');
        var workshopInfo = getWorkshopInfoFromTime(workshopTimeObj);
        var workshopObject = {};
        var exactStartingTime = workshopInfo[0];
        workshopObject.start = workshopInfo[1];
        workshopObject.end = workshopInfo[2];
        workshopObject.title = $(this).find('.workshop-title').text();
        workshopObject.session = workshopInfo[3];
        workshopObject.location = $(this).find('.inline-location').text();
        workshopObject.exactStartingTime = exactStartingTime;

        /* if we are clicking on an already selected workshop */
        if (isChosen(exactStartingTime, workshopObject, 'workshop')) {
            $(this).removeClass('selected');
            removeFromChosen(exactStartingTime, workshopObject, 'workshop');
        }
        else {
            addToChosen(exactStartingTime, workshopObject, 'workshop');
            $(this).addClass('selected');                    
        }
    });

    /* when we click on a poster ... */
    $('body').on('click', 'table.poster-table tr#poster', function(event) {
        event.preventDefault();
        var posterTimeObj = $(this).parents('.session-posters').children('.session-time');
        var posterInfo = getPosterInfoFromTime(posterTimeObj);
        var posterObject = {};
        var exactStartingTime = posterInfo[0];
        posterObject.start = posterInfo[1];
        posterObject.end = posterInfo[2];
        posterObject.title = $(this).find('.poster-title').text().trim();
        posterObject.type = $(this).parents('.poster-table').prevAll('.poster-type:first').text().trim();
        posterObject.session = posterInfo[3];
        posterObject.exactStartingTime = exactStartingTime;

        /* if we are clicking on an already selected poster */
        if (isChosen(exactStartingTime, posterObject, 'poster')) {
            $(this).removeClass('selected');
            removeFromChosen(exactStartingTime, posterObject, 'poster');
        }
        else {
            addToChosen(exactStartingTime, posterObject, 'poster');
            $(this).addClass('selected');
            var key = new Date(exactStartingTime).getTime();
            if (key in plenarySessionHash) {
                delete plenarySessionHash[key];
            }
        }
    });

    /* open the URL in a new window/tab when we click on the any icon - whether it is the keynote slides or the video - this icon can be in the abstract or even in the title if there is no abstract */            
    $('body').on('click', 'div.session-abstract p svg[class$="-icon"],span.session-title svg[class$="-icon"]', function(event) {
        event.stopPropagation();
        event.preventDefault();
        var urlToOpen = $(this).attr('data');
        if (urlToOpen !== '') {
            window.open(urlToOpen, "_blank");
        }
    });


    /* open the anthology or video URL in a new window/tab when we click on the PDF or video icon respectively  */            
    $('body').on('click', 'table.tutorial-table tr#tutorial svg[class$="-icon"],table.paper-table tr#paper svg[class$="-icon"],table.paper-table tr#best-paper svg[class$="-icon"],table.poster-table tr#poster svg[class$="-icon"]', function(event) {
        event.stopPropagation();
        event.preventDefault();
        var urlToOpen = $(this).attr('data');
        if (urlToOpen !== '') {
            window.open(urlToOpen, "_blank");
        }
    });

    $('body').on('click', 'div.session-expandable[id] table.paper-table tr#paper', function(event, fromSession) {
        event.preventDefault();
        $(this).removeClass('hovered');
        getConflicts($(this)).removeClass('conflicted');
        var paperID = $(this).attr('paper-id');
        var paperTimeObj = $(this).children('td#paper-time');
        var paperInfo = paperInfoHash[paperID];
        var paperObject = {};
        var exactStartingTime = paperInfo[0];
        paperObject.start = paperInfo[2];
        paperObject.end = paperInfo[3];
        paperObject.title = paperInfo[4];
        paperObject.session = paperInfo[5];
        paperObject.exactStartingTime = exactStartingTime;

        /* if we are clicking on an already selected paper */
        if (isChosen(exactStartingTime, paperObject, 'paper')) {
            $(this).removeClass('selected');
            removeFromChosen(exactStartingTime, paperObject, 'paper');

            /* if we are not being triggered at the session level, then we need to handle the state of the session level button ourselves */
            if (!fromSession) {

                /* we also need to enable the choose button */
                $(this).parents('table.paper-table').siblings('.session-selector').removeClass('disabled');

                /* we also need to disable the remove button if this was the only paper selected in the session */
                var selectedPapers = $(this).siblings('tr#paper').filter('.selected');
                if (selectedPapers.length == 0) {
                    $(this).parents('table.paper-table').siblings('.session-deselector').addClass('disabled');
                }
            }
        }
        else {
            /* if we are selecting a previously unselected paper */
            addToChosen(exactStartingTime, paperObject, 'paper');
            $(this).addClass('selected');

            /* if we are not being triggered at the session level, then we need to handle the state of the session level button ourselves */
            if (!fromSession) {

                /* we also need to enable the remove button */
                $(this).parents('table.paper-table').siblings('.session-deselector').removeClass('disabled');

                /* and disable the choose button if all the papers are now selected anyway */
                var sessionPapers = $(this).siblings('tr#paper');
                var selectedPapers = sessionPapers.filter('.selected');
                if (sessionPapers.length == selectedPapers.length) {
                    $(this).parents('table.paper-table').siblings('.session-selector').addClass('disabled');
                }
            }
        }
    });
});
