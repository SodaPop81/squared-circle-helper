export const loadJson = <T,>(key:string, fallback:T):T => {
 try {
  const raw=localStorage.getItem(key);
  return raw ? JSON.parse(raw) as T : fallback;
 } catch {
  return fallback;
 }
};

export const d = (sides:number) => Math.floor(Math.random()*sides)+1;
export const pct = () => d(100);
export const cap = (n:number,min:number,max:number)=>Math.max(min,Math.min(max,n));
export const stars = (n:number) => '★'.repeat(Math.floor(n)) + (n%1>=.5?'½':'');
export const moveLimitFromMinutes = (min:number) => min < 0 ? 9999 : min*3;
export const fmtTime = (moves:number) => `${String(Math.floor(moves/3)).padStart(2,'0')}:${String((moves%3)*20).padStart(2,'0')}`;
