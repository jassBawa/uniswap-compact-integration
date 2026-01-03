import { useEffect, useState } from "react";

export function useCountdown(targetTimestamp: number) {
    const [timeLeft, setTimeLeft] = useState({
        days: 0,
        hours: 0,
        minutes: 0,
        seconds: 0,
        total: 0,
    });

    useEffect(() => {
        const calculateTimeLeft = () => {
            const now = Math.floor(Date.now() / 1000);
            const difference = targetTimestamp - now;

            if (difference <= 0) {
                return { days: 0, hours: 0, minutes: 0, seconds: 0, total: 0 };
            }

            const days = Math.floor(difference / (60 * 60 * 24));
            const hours = Math.floor((difference % (60 * 60 * 24)) / (60 * 60));
            const minutes = Math.floor((difference % (60 * 60)) / 60);
            const seconds = Math.floor(difference % 60);

            return { days, hours, minutes, seconds, total: difference };
        };

        setTimeLeft(calculateTimeLeft());

        const timer = setInterval(() => {
            setTimeLeft(calculateTimeLeft());
        }, 1000);

        return () => clearInterval(timer);
    }, [targetTimestamp]);

    return timeLeft;
}
