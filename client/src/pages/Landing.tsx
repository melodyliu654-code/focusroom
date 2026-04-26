import { Link } from 'react-router-dom';
import lofiStudyRoomReference from '../assets/lofi-study-room-reference.png';

export function Landing() {
  return (
    <main className="min-h-dvh bg-[radial-gradient(circle_at_top,_rgba(154,121,255,0.28),_transparent_32%),linear-gradient(180deg,_#221833_0%,_#130f1f_100%)] px-3 py-3 sm:px-5 sm:py-5">
      <div className="mx-auto flex min-h-[calc(100dvh-1.5rem)] max-w-[1366px] items-center justify-center sm:min-h-[calc(100dvh-2.5rem)]">
        <div className="relative w-full overflow-hidden rounded-[24px] border border-white/10 shadow-[0_30px_120px_rgba(8,5,17,0.65)]">
          <img
            src={lofiStudyRoomReference}
            alt="Welcome to Lofi Study Room"
            className="block h-auto w-full object-cover"
          />

          <div className="absolute inset-x-[27%] bottom-[10.4%] flex h-[7.4%] gap-[3.1%]">
            <Link
              to="/signup"
              aria-label="Sign up"
              className="landing-button-hotspot h-full min-h-11 flex-1 rounded-full"
            >
              <span className="sr-only">Sign up</span>
            </Link>
            <Link
              to="/login"
              aria-label="Log in"
              className="landing-button-hotspot h-full min-h-11 flex-1 rounded-full"
            >
              <span className="sr-only">Log in</span>
            </Link>
          </div>
        </div>
      </div>
    </main>
  );
}
