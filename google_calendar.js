const {google} = require('googleapis');
require('dotenv').config();

// Provide the required configuration
const CREDENTIALS = JSON.parse(process.env.GOOGLE_CREDENTIALS);
const calendarId = process.env.CALENDAR_ID;

// Google calendar API settings
const SCOPES = 'https://www.googleapis.com/auth/calendar';
const calendar = google.calendar({version : "v3"});

const auth = new google.auth.JWT(
    CREDENTIALS.client_email,
    null,
    CREDENTIALS.private_key,
    SCOPES
);

// Your TIMEOFFSET Offset
const TIMEOFFSET = '-07:00';

// Get date-time string for calender
const dateTimeForCalander = () => {

    let date = new Date();

    let year = date.getFullYear();
    let month = date.getMonth() + 1;
    if(month === 13){
    month = 1
    year = date.getFullYear() +1
    }else if(month === 14){
    month = 2
    year = date.getFullYear() +1
    }else if(month === 15){
    month = 3
    year = date.getFullYear() +1
    }
    if (month < 10) {
        month = `0${month}`;
    }
    let day = date.getDate() ;
    if (day < 10) {
        day = `0${day}`;
    }
    let hour = date.getHours();
    if (hour < 10) {
        hour = `0${hour}`;
    }
    let minute = date.getMinutes();
    if (minute < 10) {
        minute = `0${minute}`;
    }

    let newDateTime = `${year}-${month}-${day}T${hour}:${minute}:00.000${TIMEOFFSET}`;

    let event = new Date(Date.parse(newDateTime));

    let ninetyday = new Date(event.getFullYear(),event.getMonth(),event.getDate()+90);

    let startDate = ninetyday;
    // Delay in end time is .1
    let endDate = new Date(new Date(startDate).setHours(startDate.getHours()+.1));

    return {
        'start': startDate,
        'end': endDate
    }
};

// Insert new event to Google Calendar
const insertEvent = async (customerEmail) => {

    let dateTime = dateTimeForCalander();

    let event = {
        'summary': `Audit for ${customerEmail}.`,
        'description': `Check activity from the member with email: ${customerEmail}`,
        'start': {
            'dateTime': dateTime['start'],
            'timeZone': 'America/Los_Angeles'
        },
        'end': {
            'dateTime': dateTime['end'],
            'timeZone': 'America/Los_Angeles'
        },
        'recurrence': [
        'RRULE:FREQ=DAILY;INTERVAL=90;COUNT=20'
        ]
    };
    console.log(dateTime)
    try {
        let response = await calendar.events.insert({
            auth: auth,
            calendarId: calendarId,
            resource: event
        });
    
        if (response['status'] == 200 && response['statusText'] === 'OK') {
            return 1;
        } else {
            return 0;
        }
    } catch (error) {
        console.log(`Error at insertEvent --> ${error}`);
        return 0;
    }
};



// // Event for Google Calendar


// insertEvent(event)
//     .then((res) => {
//         console.log(res);
//     })
//     .catch((err) => {
//         console.log(err);
//     });

// Get all the events between two dates
// const getEvents = async (dateTimeStart, dateTimeEnd) => {

//     try {
//         let response = await calendar.events.list({
//             auth: auth,
//             calendarId: calendarId,
//             timeMin: dateTimeStart,
//             timeMax: dateTimeEnd,
//             timeZone: 'Asia/Kolkata'
//         });
    
//         let items = response['data']['items'];
//         return items;
//     } catch (error) {
//         console.log(`Error at getEvents --> ${error}`);
//         return 0;
//     }
// };

// let start = '2020-10-03T00:00:00.000Z';
// let end = '2020-10-04T00:00:00.000Z';

// getEvents(start, end)
//     .then((res) => {
//         console.log(res);
//     })
//     .catch((err) => {
//         console.log(err);
//     });

// Delete an event from eventID
// const deleteEvent = async (eventId) => {

//     try {
//         let response = await calendar.events.delete({
//             auth: auth,
//             calendarId: calendarId,
//             eventId: eventId
//         });

//         if (response.data === '') {
//             return 1;
//         } else {
//             return 0;
//         }
//     } catch (error) {
//         console.log(`Error at deleteEvent --> ${error}`);
//         return 0;
//     }
// };

// let eventId = 'hkkdmeseuhhpagc862rfg6nvq4';

// deleteEvent(eventId)
//     .then((res) => {
//         console.log(res);
//     })
//     .catch((err) => {
//         console.log(err);
//     });

module.exports = { insertEvent }
