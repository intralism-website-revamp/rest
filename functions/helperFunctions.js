exports.parseWebsiteDateToDate = function(websiteDate) {
    let date = new Date();

    if(websiteDate.includes("year")) {
        let years = 1;

        if(websiteDate.includes("years")) {
            years = parseInt(websiteDate.substring(0, websiteDate.indexOf("years ago")));
        }

        years *= 31540000000;

        date.setTime(date.getTime() - years);
    } else if(websiteDate.includes("month")) {
        let months = 1;

        if(websiteDate.includes("months")) {
            months = parseInt(websiteDate.substring(0, websiteDate.indexOf("months ago")));
        }

        months *= 2628000000;

        date.setTime(date.getTime() - months);
    } else if(websiteDate.includes("week")) {
        let weeks = 1;

        if(websiteDate.includes("weeks")) {
            weeks = parseInt(websiteDate.substring(0, websiteDate.indexOf("weeks ago")));
        }

        weeks *= 604800000;

        date.setTime(date.getTime() - weeks);
    } else if(websiteDate.includes("days") || websiteDate.includes("yesterday")) {
        let days = 1;

        if(websiteDate.includes("days")) {
            days = parseInt(websiteDate.substring(0, websiteDate.indexOf("days ago")));
        }

        days *= 86400000;

        date.setTime(date.getTime() - days);
    } else if(websiteDate.includes("hour")) {
        let hours = 1;

        if(websiteDate.includes("days")) {
            hours = parseInt(websiteDate.substring(0, websiteDate.indexOf("hours ago")));
        }

        hours *= 3600000;

        date.setTime(date.getTime() - hours);
    } else if(websiteDate.includes("minute")) {
        let minutes = 1;

        if(websiteDate.includes("minutes")) {
            minutes = parseInt(websiteDate.substring(0, websiteDate.indexOf("minutes ago")));
        }

        minutes *= 60000;

        date.setTime(date.getTime() - minutes);
    }

    return date;
};

exports.validateEmail = (email) => {
    return String(email)
        .toLowerCase()
        .match(
            /^(([^<>()[\]\\.,;:\s@"]+(\.[^<>()[\]\\.,;:\s@"]+)*)|.(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/
        );
};