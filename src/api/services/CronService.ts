/* istanbul ignore file */
import cron from "node-cron";


const CreateSchedule = (time: string, task: any, zone: cron.ScheduleOptions) => {
    return cron.schedule(time, task, zone);
}



const testSchedule = CreateSchedule("*/10 * * * * *", () => { console.log("CRON executed") }, {
    scheduled: true,
    timezone: 'Africa/Lagos'
})


export const scheduleList = [
    testSchedule
];


export const RunSchedules = async (schedules: any = []) => {
    const promises = [];
    for (const schedule of schedules) {
        promises.push(schedule.start());
    }
    await Promise.all(promises);
};