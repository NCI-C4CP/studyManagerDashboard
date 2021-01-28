
export function getCurrentTimeStamp() {

    const monthList = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
    const currentDate = new Date();
    const currentMonth = monthList[currentDate.getMonth()];
    const currentDayOfMonth = currentDate.getDate();
    const currentYear = currentDate.getFullYear();
    const currentHour = currentDate.getHours();
    const currentMinute = currentDate.getMinutes();
    const currentSecond = currentDate.getSeconds();
    const timeStamp = currentMonth +" "+ currentDayOfMonth + ", "+ currentYear + " " 
                        + currentHour + ":" + currentMinute + ":" + currentSecond;
    return timeStamp; // January 28, 2021 16:11:54
    
  }
                    