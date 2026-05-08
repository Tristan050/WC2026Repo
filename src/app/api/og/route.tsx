import { ImageResponse } from "next/og";
import type { NextRequest } from "next/server";

export const runtime = "edge";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);

  const home   = searchParams.get("home")   ?? "Home";
  const away   = searchParams.get("away")   ?? "Away";
  const stage  = searchParams.get("stage")  ?? "World Cup 2026";
  const hs     = searchParams.get("hs")     ?? "0";
  const as_    = searchParams.get("as")     ?? "0";
  const status = searchParams.get("status") ?? "UPCOMING";
  const pick   = searchParams.get("pick");

  const isLive = ["LIVE","HALFTIME","EXTRA_TIME","PENALTIES"].includes(status);
  const isFt   = status === "FINISHED";

  const pickLabel: Record<string, string> = {
    HOME: `I picked ${home}`,
    AWAY: `I picked ${away}`,
    DRAW: "I picked a Draw",
  };

  return new ImageResponse(
    (
      <div style={{
        width:"1200px", height:"630px",
        display:"flex", flexDirection:"column",
        background:"linear-gradient(135deg, #03080f 0%, #071525 50%, #03080f 100%)",
        fontFamily:"sans-serif",
        position:"relative", overflow:"hidden",
      }}>
        {/* Background glow */}
        <div style={{position:"absolute",top:-100,right:-100,width:500,height:500,borderRadius:"50%",background:"radial-gradient(circle,rgba(0,102,255,0.2) 0%,transparent 65%)"}} />
        <div style={{position:"absolute",bottom:-80,left:-80,width:350,height:350,borderRadius:"50%",background:"radial-gradient(circle,rgba(0,232,122,0.08) 0%,transparent 65%)"}} />
        {/* Top accent line */}
        <div style={{position:"absolute",top:0,left:0,right:0,height:3,background:"linear-gradient(90deg,transparent,#0066ff,#3385ff,transparent)"}} />

        {/* Header */}
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",padding:"36px 56px 0"}}>
          <div style={{fontSize:28,fontWeight:900,letterSpacing:"0.06em",color:"#fff"}}>
            WORLD<span style={{color:"#3385ff"}}>CUP</span>CLUTCH
          </div>
          <div style={{
            fontSize:17,color:"#94b4d4",
            padding:"6px 20px",border:"1px solid rgba(0,102,255,0.35)",
            borderRadius:999,background:"rgba(0,102,255,0.1)",
            letterSpacing:"0.04em",
          }}>
            {stage}
          </div>
        </div>

        {/* Main matchup */}
        <div style={{display:"flex",flex:1,alignItems:"center",justifyContent:"center",padding:"0 56px",gap:0}}>
          {/* Home */}
          <div style={{flex:1,display:"flex",flexDirection:"column",alignItems:"center",gap:16}}>
            <div style={{fontSize:72}}>{home.toLowerCase().includes("mexico")?"🇲🇽":home.toLowerCase().includes("brazil")?"🇧🇷":home.toLowerCase().includes("france")?"🇫🇷":home.toLowerCase().includes("germany")?"🇩🇪":home.toLowerCase().includes("argentina")?"🇦🇷":home.toLowerCase().includes("england")?"🏴󠁧󠁢󠁥󠁮󠁧󠁿":"⚽"}</div>
            <div style={{fontSize:40,fontWeight:900,color:"#fff",textAlign:"center",lineHeight:1.1,letterSpacing:"-0.01em"}}>{home}</div>
          </div>

          {/* Score / vs */}
          <div style={{display:"flex",flexDirection:"column",alignItems:"center",gap:12,padding:"0 44px"}}>
            {(isLive || isFt) ? (
              <div style={{
                fontSize:80,fontWeight:900,color:"#fff",letterSpacing:"0.1em",
                background:"rgba(255,255,255,0.06)",border:"2px solid rgba(255,255,255,0.15)",
                borderRadius:20,padding:"10px 36px",
              }}>
                {hs} – {as_}
              </div>
            ) : (
              <div style={{fontSize:52,fontWeight:900,color:"#3385ff",letterSpacing:"0.15em"}}>VS</div>
            )}
            {isLive && (
              <div style={{
                fontSize:19,fontWeight:800,color:"#ff7080",
                background:"rgba(255,51,85,0.15)",border:"1px solid rgba(255,51,85,0.5)",
                borderRadius:999,padding:"5px 18px",letterSpacing:"0.08em",
              }}>
                ● LIVE
              </div>
            )}
            {isFt && (
              <div style={{
                fontSize:19,fontWeight:800,color:"#33cc77",
                background:"rgba(0,232,122,0.12)",border:"1px solid rgba(0,232,122,0.4)",
                borderRadius:999,padding:"5px 18px",letterSpacing:"0.08em",
              }}>
                FULL TIME
              </div>
            )}
          </div>

          {/* Away */}
          <div style={{flex:1,display:"flex",flexDirection:"column",alignItems:"center",gap:16}}>
            <div style={{fontSize:72}}>{away.toLowerCase().includes("spain")?"🇪🇸":away.toLowerCase().includes("portugal")?"🇵🇹":away.toLowerCase().includes("netherlands")?"🇳🇱":away.toLowerCase().includes("argentina")?"🇦🇷":away.toLowerCase().includes("usa")?"🇺🇸":"⚽"}</div>
            <div style={{fontSize:40,fontWeight:900,color:"#fff",textAlign:"center",lineHeight:1.1,letterSpacing:"-0.01em"}}>{away}</div>
          </div>
        </div>

        {/* Pick banner */}
        {pick && pickLabel[pick] && (
          <div style={{
            margin:"0 56px 20px",padding:"16px 28px",
            background:"linear-gradient(135deg,rgba(0,102,255,0.18),rgba(0,102,255,0.08))",
            border:"1px solid rgba(0,102,255,0.45)",borderRadius:16,
            display:"flex",alignItems:"center",gap:14,
          }}>
            <span style={{fontSize:30}}>🎯</span>
            <span style={{fontSize:26,fontWeight:700,color:"#80b3ff"}}>{pickLabel[pick]}</span>
            <span style={{marginLeft:"auto",fontSize:19,color:"#4a6a8a",fontWeight:600}}>Beat me on WorldCupClutch →</span>
          </div>
        )}

        {/* Footer */}
        <div style={{
          display:"flex",justifyContent:"center",alignItems:"center",gap:12,
          padding:"12px 56px 36px",borderTop:"1px solid rgba(255,255,255,0.05)",
        }}>
          <span style={{fontSize:16,color:"#2a4060",letterSpacing:"0.05em"}}>worldcupclutch.com · Free World Cup 2026 Prediction Game</span>
        </div>
      </div>
    ),
    { width:1200, height:630 }
  );
}