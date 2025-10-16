interface ICalendarActivity  {
    id?: string,
    date: number,
    activityName: string,
    activityDesc: string
    done?: boolean,

    onEventMarkedAsDone?: () => void

}


export type {ICalendarActivity};