import "next-auth";
import "next-auth/jwt";

declare module "next-auth" {
  interface Session {
    user: {
      id:            string;
      name?:         string | null;
      email?:        string | null;
      image?:        string | null;
      username?:     string | null;
      points:        number;
      xp:            number;
      streakCurrent: number;
      streakBest:    number;
      role:          string;
    };
  }

  interface User {
    username?:     string | null;
    points:        number;
    xp:            number;
    streakCurrent: number;
    streakBest:    number;
    role:          string;
  }
}