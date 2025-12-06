const __vite__mapDeps=(i,m=__vite__mapDeps,d=(m.f||(m.f=["assets/chat-services-Cu3qEsr4.js","assets/ai-vendor-DDPwdD9r.js","assets/storage-services-CGAvbDuH.js","assets/auth-BtygLHFy.js","assets/react-vendor-JBKW6UM3.js","assets/carousel-vendor-DbqMuwPS.js","assets/vendor-CJ8PTbpw.js","assets/supabase-vendor-ClpCPKgU.js","assets/supabase-realtime-8-W1bgUD.js","assets/core-services-l3Z0YdbM.js","assets/framer-vendor-DZk8000h.js","assets/gaming-services-B7CAQC8e.js"])))=>i.map(i=>d[i]);
var Ze=Object.defineProperty;var et=(a,e,t)=>e in a?Ze(a,e,{enumerable:!0,configurable:!0,writable:!0,value:t}):a[e]=t;var y=(a,e,t)=>et(a,typeof e!="symbol"?e+"":e,t);import{s as u}from"./auth-BtygLHFy.js";import{l as tt,r as rt}from"./gaming-services-B7CAQC8e.js";import{n as st,s as at,S as k,U as ot,T as Ae,a as H,j as I,c as Z,C as Ce,_ as Re,e as nt}from"./chat-services-Cu3qEsr4.js";import{S as P}from"./storage-services-CGAvbDuH.js";import{a as ee}from"./core-services-l3Z0YdbM.js";class it{constructor(){y(this,"toasts",[]);y(this,"listeners",new Set);y(this,"maxToasts",5)}subscribe(e){return this.listeners.add(e),e(this.toasts),()=>{this.listeners.delete(e)}}notify(){this.listeners.forEach(e=>e([...this.toasts]))}show(e,t="info",r={}){const s=`toast-${Date.now()}-${Math.random().toString(36).substr(2,9)}`,o={id:s,message:e,type:t,duration:r.duration??this.getDefaultDuration(t),action:r.action,dismissible:r.dismissible??!0};return this.toasts.unshift(o),this.toasts.length>this.maxToasts&&(this.toasts=this.toasts.slice(0,this.maxToasts)),this.notify(),o.duration&&o.duration>0&&setTimeout(()=>this.dismiss(s),o.duration),s}success(e,t){return this.show(e,"success",{duration:3e3,...t})}error(e,t){return this.show(e,"error",{duration:7e3,dismissible:!0,...t})}warning(e,t){return this.show(e,"warning",{duration:5e3,...t})}info(e,t){return this.show(e,"info",{duration:4e3,...t})}dismiss(e){const t=this.toasts.findIndex(r=>r.id===e);t!==-1&&(this.toasts.splice(t,1),this.notify())}dismissAll(){this.toasts=[],this.notify()}getDefaultDuration(e){switch(e){case"success":return 3e3;case"error":return 7e3;case"warning":return 5e3;case"info":return 4e3;default:return 4e3}}loading(e){const t=this.show(e,"info",{duration:0,dismissible:!1});return()=>this.dismiss(t)}async promise(e,t){const r=this.loading(t.loading);try{const s=await e;r();const o=typeof t.success=="function"?t.success(s):t.success;return this.success(o),s}catch(s){r();const o=typeof t.error=="function"?t.error(s):t.error;throw this.error(o),s}}}const se=new it;let z=!1;typeof window<"u"&&typeof document<"u"&&(document.addEventListener("visibilitychange",()=>{z=document.hidden}),window.addEventListener("blur",()=>{z=!0}),window.addEventListener("focus",()=>{document.hidden||(z=!1)}));const ct=async(a,e="Otagon AI")=>{if(!(!z&&!document.hidden)&&!(!("Notification"in window)||Notification.permission!=="granted"))try{const t=a.length>100?a.substring(0,97)+"...":a,r=new Notification(e,{body:t,icon:"/icon-192.png",badge:"/icon-192.png",tag:"otagon-ai-response",requireInteraction:!1,silent:!1});setTimeout(()=>r.close(),1e4),r.onclick=()=>{window.focus(),r.close()}}catch(t){console.error("Failed to show notification:",t)}},lt=()=>z||document.hidden,kr=Object.freeze(Object.defineProperty({__proto__:null,isScreenLockedOrHidden:lt,showAINotification:ct,toastService:se},Symbol.toStringTag,{value:"Module"}));class te{static handle(e,t,r){this.errorCount++,!this.isErrorRateLimited()&&(console.error(`[${t}]`,{message:e.message,stack:e.stack,context:t,timestamp:new Date().toISOString(),errorCount:this.errorCount}),r&&this.showUserMessage(r),this.reportError(e,t))}static handleAuthError(e,t){const r=this.getAuthErrorMessage(t);this.handle(e,`AuthService:${t}`,r)}static handleWebSocketError(e,t){const r=this.getWebSocketErrorMessage(t);this.handle(e,`WebSocketService:${t}`,r)}static handleConversationError(e,t){const r=this.getConversationErrorMessage(t);this.handle(e,`ConversationService:${t}`,r)}static handleDatabaseError(e,t){const r=this.getDatabaseErrorMessage(t);this.handle(e,`DatabaseService:${t}`,r)}static isErrorRateLimited(){const e=Date.now();return this.recentErrors=this.recentErrors.filter(t=>e-t<this.errorWindow),this.recentErrors.push(e),this.recentErrors.length>this.maxErrorsPerMinute}static showUserMessage(e){}static reportError(e,t){console.warn("[Error Reporting] Would report error to monitoring service:",{error:e.message,context:t,timestamp:new Date().toISOString()})}static getAuthErrorMessage(e){return{signIn:"Failed to sign in. Please check your credentials and try again.",signOut:"Failed to sign out. Please try again.",loadUser:"Failed to load user data. Please refresh the page.",createUser:"Failed to create user account. Please try again.",refreshUser:"Failed to refresh user data. Please try again."}[e]||"An authentication error occurred. Please try again."}static getWebSocketErrorMessage(e){return{connect:"Failed to connect to server. Please check your internet connection.",send:"Failed to send message. Please try again.",disconnect:"Failed to disconnect. Please try again."}[e]||"A connection error occurred. Please try again."}static getConversationErrorMessage(e){return{create:"Failed to create conversation. Please try again.",load:"Failed to load conversations. Please refresh the page.",save:"Failed to save conversation. Please try again.",delete:"Failed to delete conversation. Please try again."}[e]||"A conversation error occurred. Please try again."}static getDatabaseErrorMessage(e){return{save:"Failed to save data. Please try again.",load:"Failed to load data. Please refresh the page.",update:"Failed to update data. Please try again.",delete:"Failed to delete data. Please try again."}[e]||"A database error occurred. Please try again."}static getStats(){return{totalErrors:this.errorCount,recentErrors:this.recentErrors.length,isRateLimited:this.isErrorRateLimited()}}static reset(){this.errorCount=0,this.recentErrors=[]}}y(te,"errorCount",0),y(te,"maxErrorsPerMinute",10),y(te,"errorWindow",60*1e3),y(te,"recentErrors",[]);const re=a=>a,M=class M{constructor(){}static getInstance(){return M.instance||(M.instance=new M),M.instance}async getOnboardingStatus(e){try{const{data:t,error:r}=await u.rpc("get_user_onboarding_status",{p_user_id:e});if(r)return console.error("🎯 [OnboardingService] Error getting onboarding status:",r),null;if(!t||t.length===0)return null;const s=t[0];return console.log("🎯 [OnboardingService] Onboarding status (first element):",s),s}catch(t){return console.error("🎯 [OnboardingService] Error getting onboarding status:",t),null}}async updateOnboardingStatus(e,t,r={}){try{const{error:s}=await u.rpc("update_user_onboarding_status",{p_user_id:e,p_step:t,p_data:re(r)});return s?(console.error("Error updating onboarding status:",s),!1):!0}catch(s){return console.error("Error updating onboarding status:",s),!1}}async getOnboardingProgress(e){try{const{data:t,error:r}=await u.from("onboarding_progress").select("*").eq("user_id",e).order("completed_at",{ascending:!0});return r?(console.error("Error getting onboarding progress:",r),[]):(t||[]).map(s=>({step:s.step,completed_at:s.created_at||"",data:typeof s.data=="object"&&s.data!==null&&!Array.isArray(s.data)?s.data:{}}))}catch(t){return console.error("Error getting onboarding progress:",t),[]}}async markSplashScreensSeen(e){return this.updateOnboardingStatus(e,"initial",{splash_screens_seen:!0,timestamp:new Date().toISOString()})}async markProfileSetupComplete(e,t){try{const{error:r}=await u.from("users").update({has_profile_setup:!0,profile_data:re(t),updated_at:new Date().toISOString()}).eq("auth_user_id",e);return r?(console.error("Error marking profile setup complete:",r),!1):!0}catch(r){return console.error("Error marking profile setup complete:",r),!1}}async markWelcomeMessageShown(e){return this.updateOnboardingStatus(e,"complete",{welcome_message_shown:!0,timestamp:new Date().toISOString()})}async markOnboardingComplete(e){return this.updateOnboardingStatus(e,"complete",{onboarding_complete:!0,timestamp:new Date().toISOString()})}getBooleanValue(e,t=!1){return e==null?t:!!e}getNextOnboardingStepFromUser(e){const t=this.getBooleanValue(e.hasSeenSplashScreens),r=this.getBooleanValue(e.hasSeenHowToUse),s=this.getBooleanValue(e.hasSeenFeaturesConnected),o=this.getBooleanValue(e.hasSeenProFeatures),n=this.getBooleanValue(e.pcConnected),i=this.getBooleanValue(e.pcConnectionSkipped);return t?t&&!r?"how-to-use":r&&n&&!s?"features-connected":r&&!n&&i&&!o?"pro-features":r&&!n&&!i?"how-to-use":s&&!o?"pro-features":o?"complete":(console.error("🎯 [OnboardingService] ERROR: Unexpected onboarding flow state",{hasSeenSplashScreens:t,hasSeenHowToUse:r,hasSeenFeaturesConnected:s,hasSeenProFeatures:o,pcConnected:n,pcConnectionSkipped:i}),"how-to-use"):"initial"}async getNextOnboardingStep(e){try{const t=await this.getOnboardingStatus(e);if(!t)return"login";const r=this.getBooleanValue(t.has_seen_splash_screens),s=this.getBooleanValue(t.has_seen_how_to_use),o=this.getBooleanValue(t.has_seen_features_connected),n=this.getBooleanValue(t.has_seen_pro_features),i=this.getBooleanValue(t.pc_connected),c=this.getBooleanValue(t.pc_connection_skipped);return r?r&&!s?"how-to-use":s&&i&&!o?"features-connected":s&&!i&&c&&!n?"pro-features":s&&!i&&!c?"how-to-use":o&&!n?"pro-features":n?"complete":(console.error("🎯 [OnboardingService] ERROR: Unexpected onboarding flow state",{hasSeenSplashScreens:r,hasSeenHowToUse:s,hasSeenFeaturesConnected:o,hasSeenProFeatures:n,pcConnected:i,pcConnectionSkipped:c}),"how-to-use"):"initial"}catch(t){return console.error("🎯 [OnboardingService] Error getting next onboarding step:",t),"login"}}async shouldShowOnboarding(e){try{const t=await this.getOnboardingStatus(e);return t?!t.onboarding_completed:!0}catch(t){return console.error("Error checking if should show onboarding:",t),!0}}async trackOnboardingStep(e,t,r,s={}){try{await u.from("user_analytics").insert({user_id:e,auth_user_id:e,event_type:"onboarding_step",event_data:re({step:t,action:r,data:s,timestamp:new Date().toISOString()})})}catch(o){console.error("Error tracking onboarding step:",o)}}async trackOnboardingDropOff(e,t,r,s={}){try{await u.from("user_analytics").insert({user_id:e,auth_user_id:e,event_type:"onboarding_dropoff",event_data:re({step:t,reason:r,data:s,timestamp:new Date().toISOString()})})}catch(o){console.error("Error tracking onboarding dropoff:",o)}}async resetOnboarding(e){try{const{error:t}=await u.from("onboarding_progress").delete().eq("user_id",e);if(t)return console.error("Error clearing onboarding progress:",t),!1;const{error:r}=await u.from("users").update({is_new_user:!0,has_seen_splash_screens:!1,has_profile_setup:!1,has_welcome_message:!1,onboarding_completed:!1,onboarding_data:{}}).eq("id",e);return r?(console.error("Error resetting user onboarding flags:",r),!1):!0}catch(t){return console.error("Error resetting onboarding:",t),!1}}async getOnboardingStats(){try{const{count:e}=await u.from("users").select("*",{count:"exact",head:!0}),{count:t}=await u.from("users").select("*",{count:"exact",head:!0}).eq("onboarding_completed",!0),{data:r}=await u.from("user_analytics").select("event_data").eq("event_type","onboarding_dropoff"),s={};return r&&r.forEach(o=>{const n=o.event_data;if(typeof n=="object"&&n!==null&&!Array.isArray(n)){const i=n.step;typeof i=="string"&&(s[i]=(s[i]||0)+1)}}),{total_users:e||0,completed_onboarding:t||0,dropoff_by_step:s}}catch(e){return console.error("Error getting onboarding stats:",e),{total_users:0,completed_onboarding:0,dropoff_by_step:{}}}}};y(M,"instance");let de=M;const ut=de.getInstance(),Ir=Object.freeze(Object.defineProperty({__proto__:null,onboardingService:ut},Symbol.toStringTag,{value:"Module"}));let S=null;const dt="wss://otakon-relay.onrender.com";let Y=0;const gt=5e3,ge=[];let ae=null,f=null,v=null,oe=!0;const mt=3e4,ht=(a,e,t,r,s)=>{if(S&&(S.readyState===WebSocket.OPEN||S.readyState===WebSocket.CONNECTING))return;if(!/^\d{6}$/.test(a)){const n="Invalid code format. Please enter a 6-digit code.";r(n),se.error(n);return}ae=a,f={onOpen:e,onMessage:t,onError:r,onClose:s},oe=!0;const o=`${dt}/${a}`;try{S=new WebSocket(o)}catch(n){const c=`Connection failed: ${n instanceof Error?n.message:"An unknown error occurred."}. Please check the URL and your network connection.`;r(c),se.error("PC connection failed. Please check your network and try again.");return}S.onopen=()=>{console.log("🔗 [WebSocket] Connection opened successfully to",o),Y=0,f&&typeof f.onOpen=="function"&&f.onOpen();try{S==null||S.send(JSON.stringify({type:"connection_request",code:a,ts:Date.now()})),console.log("🔗 [WebSocket] Sent connection_request with code:",a)}catch(n){console.error("🔗 [WebSocket] Failed to send connection_request:",n)}for(;ge.length&&S&&S.readyState===WebSocket.OPEN;){const n=ge.shift();try{S.send(JSON.stringify(n)),console.log("🔗 [WebSocket] Sent queued message:",n==null?void 0:n.type)}catch(i){console.error("🔗 [WebSocket] Failed to send queued message:",i)}}v&&(clearInterval(v),v=null),v=window.setInterval(()=>{if(S&&S.readyState===WebSocket.OPEN)try{S.send(JSON.stringify({type:"ping",ts:Date.now()}))}catch{}},mt)},S.onmessage=n=>{var i;try{const c=JSON.parse(n.data);if(console.log("🔗 [WebSocket] Message received:",{type:c.type||"unknown",hasDataUrl:!!c.dataUrl,dataUrlLength:(i=c.dataUrl)==null?void 0:i.length,keys:Object.keys(c)}),c.type==="error"||c.error){const l=c.message||c.error||"Connection failed";console.error("🔗 [WebSocket] Server error:",l),localStorage.removeItem("otakon_connection_code"),localStorage.removeItem("otakon_last_connection"),f&&typeof f.onError=="function"&&f.onError(l);return}if(c.type==="no_partner"||c.type==="partner_not_found"||c.type==="invalid_code"){const l="No PC client found with this code. Please check the code and ensure the PC client is running.";console.error("🔗 [WebSocket] No partner found:",c),localStorage.removeItem("otakon_connection_code"),localStorage.removeItem("otakon_last_connection"),f&&typeof f.onError=="function"&&f.onError(l);return}if((c.type==="partner_disconnected"||c.type==="partner_left"||c.type==="peer_disconnected")&&console.log("🔗 [WebSocket] Partner disconnected - PC app closed or lost connection"),(c.type==="screenshot_success"||c.type==="screenshot_batch"||c.type==="screenshot")&&console.log("🔗 [WebSocket] Full screenshot message:",JSON.stringify(c).substring(0,500)),f&&typeof f.onMessage=="function"){console.log("🔗 [WebSocket] Invoking onMessage handler with data:",c.type);try{f.onMessage(c),console.log("🔗 [WebSocket] Handler completed successfully")}catch(l){console.error("🔗 [WebSocket] Handler threw error:",l)}}else console.error("🔗 [WebSocket] No valid onMessage handler!",f)}catch(c){console.error("🔗 [WebSocket] Failed to parse message:",n.data,c)}},S.onerror=()=>{},S.onclose=n=>{if(console.log("🔗 [WebSocket] Connection closed:",{wasClean:n.wasClean,code:n.code,reason:n.reason}),!n.wasClean){let i="Connection closed unexpectedly.";n.code===1006?(i="Connection to the server failed. Please check your network, verify the code, and ensure the PC client is running.",Y===0&&se.warning("PC connection lost. Attempting to reconnect...")):n.reason&&(i=`Connection closed: ${n.reason}`),f&&typeof f.onError=="function"&&f.onError(i)}if(S=null,f&&typeof f.onClose=="function"&&f.onClose(),v&&(clearInterval(v),v=null),oe&&ae&&f){Y+=1;const i=Math.min(gt,500*Math.pow(2,Y-1)),c=Math.random()*300,l=i+c;setTimeout(()=>{!S&&f&&oe&&ht(ae,f.onOpen,f.onMessage,f.onError,f.onClose)},l)}}},Pr=a=>{S&&S.readyState===WebSocket.OPEN?S.send(JSON.stringify(a)):ge.push(a)},Gr=()=>{oe=!1,S&&(S.close(1e3,"User disconnected"),S=null),Y=0,v&&(clearInterval(v),v=null),ae=null,f=null},Dr=(a,e,t,r)=>{f={onOpen:a,onMessage:e,onError:t,onClose:r},console.log("🔗 [WebSocket] Handlers updated")};class Mr{static async addToWaitlist(e,t="landing_page"){try{const{data:r,error:s}=await u.from("waitlist").insert({email:e,source:t,status:"pending"}).select();if(s){if(console.error("Error adding to waitlist:",s),console.error("Insert error details:",{message:s.message,code:s.code,details:s.details,hint:s.hint}),s.code==="23505")return{success:!0,alreadyExists:!0,error:"You're already on our waitlist! We'll email you when access is ready."};const{data:o,error:n}=await u.from("waitlist").select("email, status, created_at").eq("email",e).maybeSingle();return n?(console.error("Error checking existing email:",n),{success:!1,error:`Failed to add to waitlist: ${s.message}`}):o?{success:!0,alreadyExists:!0,error:"You're already on our waitlist! We'll email you when access is ready."}:{success:!1,error:`Failed to add to waitlist: ${s.message}`}}return{success:!0,alreadyExists:!1,error:void 0}}catch(r){return console.error("Waitlist service error:",r),{success:!1,error:"An unexpected error occurred"}}}static async getWaitlistCount(){try{const{count:e,error:t}=await u.from("waitlist").select("*",{count:"exact",head:!0});return t?(console.error("Error getting waitlist count:",t),{error:"Failed to get count"}):{count:e||0}}catch(e){return console.error("Error getting waitlist count:",e),{error:"Failed to get count"}}}static async getWaitlistStats(){try{const{data:e,error:t}=await u.from("waitlist").select("status");if(t)return console.error("Error fetching waitlist stats:",t),{total:137,pending:137,invited:0,converted:0};const r={total:e.length,pending:0,invited:0,converted:0};return e.forEach(s=>{const o=s.status||"pending";o==="pending"?r.pending++:o==="approved"?r.invited++:o==="rejected"&&r.converted++}),r}catch(e){return console.error("Error fetching waitlist stats:",e),{total:137,pending:137,invited:0,converted:0}}}}const Ur=a=>{const e=new Map;let t=a;console.log(`🏷️ [otakonTags] Parsing response (${a.length} chars)...`);const r=/\[OTAKON_SUGGESTIONS:\s*(\[[\s\S]*?\])\s*\]/g;let s;for(;(s=r.exec(a))!==null;)try{const m=s[1].replace(/'/g,'"'),d=JSON.parse(m);e.set("SUGGESTIONS",d),t=t.replace(s[0],""),console.log("🏷️ [otakonTags] Extracted SUGGESTIONS:",d)}catch{console.warn("[OtakonTags] Failed to parse SUGGESTIONS JSON:",s[1])}const o=/\[OTAKON_SUBTAB_UPDATE:\s*\{[^\]]*\}\s*\]/g;let n;const i=[];for(;(n=o.exec(a))!==null;){try{const m=n[0].match(/\{[^\]]*\}/);if(m){const d=JSON.parse(m[0]);i.push(d)}}catch{console.warn("[OtakonTags] Failed to parse SUBTAB_UPDATE JSON:",n[0])}t=t.replace(n[0],"")}i.length>0&&e.set("SUBTAB_UPDATE",i);const c=/\[OTAKON_SUBTAB_CONSOLIDATE:\s*\{[^\]]*\}\s*\]/g;let l;const p=[];for(;(l=c.exec(a))!==null;){try{const m=l[0].match(/\{[^\]]*\}/);if(m){const d=JSON.parse(m[0]);p.push(d),console.log("📦 [otakonTags] Extracted SUBTAB_CONSOLIDATE:",d)}}catch{console.warn("[OtakonTags] Failed to parse SUBTAB_CONSOLIDATE JSON:",l[0])}t=t.replace(l[0],"")}p.length>0&&e.set("SUBTAB_CONSOLIDATE",p);let h=null;const T=a.match(/\[OTAKON_PROGRESS[:\s]+(\d+)/i);if(T&&(h=parseInt(T[1],10),console.log(`📊 [otakonTags] Found OTAKON_PROGRESS format: ${T[0]} → ${h}%`)),!h){const m=a.match(/\[?PROGRESS[:\s]+(\d+)/i);m&&(h=parseInt(m[1],10),console.log(`📊 [otakonTags] Found PROGRESS format: ${m[0]} → ${h}%`))}if(!h){const m=a.match(/(?:progress|completion|game progress)[:\s]+(?:approximately\s+)?(\d+)\s*%/i);m&&(h=parseInt(m[1],10),console.log(`📊 [otakonTags] Found inline progress format: ${m[0]} → ${h}%`))}if(!h){const m=a.match(/"stateUpdateTags"[^}]*"PROGRESS[:\s]+(\d+)/i);m&&(h=parseInt(m[1],10),console.log(`📊 [otakonTags] Found stateUpdateTags PROGRESS: ${m[0]} → ${h}%`))}h!==null&&h>=0&&h<=100?(e.set("PROGRESS",h),console.log(`📊 [otakonTags] ✅ Set PROGRESS tag to: ${h}%`)):console.log("📊 [otakonTags] ⚠️ No valid progress found in response");const w=/\[OTAKON_([A-Z_]+):\s*([^[\]]+?)\]/g;let b;for(;(b=w.exec(a))!==null;){const m=b[1];let d=b[2].trim();if(console.log(`🏷️ [otakonTags] Found tag: ${m} = ${b[2].substring(0,50)}`),!(m==="SUGGESTIONS"||m==="SUBTAB_UPDATE")){try{const E=d;E.startsWith("{")&&E.endsWith("}")&&(d=JSON.parse(E)),E.startsWith("[")&&E.endsWith("]")&&(d=JSON.parse(E.replace(/'/g,'"')))}catch{}if(m==="PROGRESS"){const E=String(d).trim(),x=E.match(/(\d+)/);if(x){const K=parseInt(x[1],10);d=Math.min(100,Math.max(0,K)),console.log(`📊 [otakonTags] Parsed PROGRESS: "${E}" → ${d}`)}else console.warn(`📊 [otakonTags] Could not parse PROGRESS value: "${E}"`)}e.set(m,d),t=t.replace(b[0],"")}}return t=t.replace(/^I['']?m\s+Otagon,\s+your\s+dedicated\s+gaming\s+lore\s+expert[^\n]*\n*/i,"").trim(),e.size>0&&console.log(`🏷️ [otakonTags] Extracted ${e.size} tags:`,Array.from(e.keys()).join(", ")),{cleanContent:t,tags:e}},U=class U{static getInstance(){return U.instance||(U.instance=new U),U.instance}generateCacheKey(e,t){var n;const r={prompt:e.trim().toLowerCase(),gameTitle:(n=t.gameTitle)==null?void 0:n.toLowerCase(),mode:t.mode},s=JSON.stringify(r);let o=0;for(let i=0;i<s.length;i++){const c=s.charCodeAt(i);o=(o<<5)-o+c,o=o&o}return Math.abs(o).toString(36)}async getCachedResponse(e){try{const{data:t,error:r}=await u.from("ai_responses").select("response_data, created_at, model_used, tokens_used, cache_type").eq("cache_key",e).gt("expires_at",new Date().toISOString()).single();if(r)return r.code==="PGRST116"?(console.log("❌ [aiCacheService] Cache MISS:",e.substring(0,8)),null):(console.error("❌ [aiCacheService] Error checking cache:",r),null);if(t){const s=t.created_at?Math.floor((Date.now()-new Date(t.created_at).getTime())/1e3/60):0;return console.log("✅ [aiCacheService] Cache HIT:",e.substring(0,8),{age:`${s}m`,model:t.model_used,tokens:t.tokens_used,type:t.cache_type}),t.response_data}return null}catch(t){return console.error("Error in getCachedResponse:",t),null}}async cacheResponse(e,t,r){try{const s=new Date;s.setHours(s.getHours()+r.ttlHours);const{data:{user:o}}=await u.auth.getUser(),{error:n}=await u.from("ai_responses").upsert({cache_key:e,response_data:JSON.parse(JSON.stringify(t)),game_title:r.gameTitle,cache_type:r.cacheType,conversation_id:r.conversationId,model_used:r.modelUsed,tokens_used:r.tokensUsed,user_id:o==null?void 0:o.id,expires_at:s.toISOString(),created_at:new Date().toISOString()},{onConflict:"cache_key"});return n?(console.error("Error caching response:",n),!1):(console.log("💾 Cached response:",e.substring(0,8),{type:r.cacheType,ttl:r.ttlHours+"h",tokens:r.tokensUsed,game:r.gameTitle}),!0)}catch(s){return console.error("Error in cacheResponse:",s),!1}}determineCacheType(e){return e.gameTitle?"game_specific":e.hasUserContext||e.conversationId?"user":"global"}determineTTL(e,t){switch(e){case"global":return 168;case"game_specific":return 24;case"user":return 12;default:return 24}}shouldCache(e,t){if(console.log(`🔍 [aiCacheService] shouldCache called with prompt: "${e.substring(0,50)}..."`,t),t.noCache===!0)return!1;if(e.trim().length<10)return console.log(`❌ [aiCacheService] Not caching: prompt too short (${e.trim().length} chars)`),!1;const r=["today","now","current","latest","recent","just released"],s=e.toLowerCase();return!r.find(n=>s.includes(n))}async cleanupExpiredCache(){try{const{data:e,error:t}=await u.from("ai_responses").delete().lt("expires_at",new Date().toISOString()).select("id");return t?(console.error("Error cleaning up cache:",t),{deleted:0}):{deleted:(e==null?void 0:e.length)||0}}catch(e){return console.error("Error in cleanupExpiredCache:",e),{deleted:0}}}async getCacheStats(){try{const{data:e,error:t}=await u.from("ai_responses").select("cache_type, tokens_used").gt("expires_at",new Date().toISOString());if(t)return console.error("Error getting cache stats:",t),{totalEntries:0,byType:{},totalTokensSaved:0};const r={totalEntries:e.length,byType:{},totalTokensSaved:e.reduce((s,o)=>s+(o.tokens_used||0),0)};return e.forEach(s=>{const o=s.cache_type||"unknown";r.byType[o]=(r.byType[o]||0)+1}),r}catch(e){return console.error("Error in getCacheStats:",e),{totalEntries:0,byType:{},totalTokensSaved:0}}}async invalidateGameCache(e){try{const{error:t}=await u.from("ai_responses").delete().eq("game_title",e).eq("cache_type","game_specific");return t?(console.error("Error invalidating game cache:",t),!1):!0}catch(t){return console.error("Error in invalidateGameCache:",t),!1}}};y(U,"instance");let me=U;const Lr=me.getInstance(),L=class L{constructor(){}static getInstance(){return L.instance||(L.instance=new L),L.instance}generateProfileSpecificTabs(e,t){const r=[];return e.playerFocus==="Story-Driven"&&r.push({id:"narrative_themes",title:"Narrative Themes",type:"story",priority:"high",isProfileSpecific:!0,instruction:this.getNarrativeThemesInstruction(e.hintStyle)}),e.playerFocus==="Completionist"&&r.push({id:"secret_hunting",title:"Secret Hunting",type:"tips",priority:"high",isProfileSpecific:!0,instruction:this.getSecretHuntingInstruction(e.hintStyle)}),e.playerFocus==="Strategist"&&r.push({id:"optimization_guide",title:"Optimization Guide",type:"strategies",priority:"high",isProfileSpecific:!0,instruction:this.getOptimizationInstruction(e.hintStyle)}),t!=null&&t.playthroughCount&&t.playthroughCount>1&&r.push({id:"playthrough_comparison",title:"Playthrough Comparison",type:"tips",priority:"medium",isProfileSpecific:!0,instruction:this.getPlaythroughComparisonInstruction(e)}),r}getNarrativeThemesInstruction(e){const t={Cryptic:"Provide subtle hints about story themes without revealing major plot points. Use metaphorical language and thematic connections.",Balanced:"Discuss narrative elements with moderate detail, balancing spoiler avoidance with meaningful insight into themes and character arcs.",Direct:"Explain story themes clearly while maintaining appropriate spoiler warnings. Provide direct analysis of narrative elements encountered so far."};return t[e]||t.Balanced}getSecretHuntingInstruction(e){const t={Cryptic:"Give mysterious clues about hidden content locations. Use environmental riddles and subtle hints that require exploration.",Balanced:"Provide clear directions to secrets with some exploration challenge. Balance helpfulness with maintaining the joy of discovery.",Direct:"Give precise locations and requirements for finding secrets. Include step-by-step instructions and exact coordinates when helpful."};return t[e]||t.Balanced}getOptimizationInstruction(e){const t={Cryptic:"Suggest optimization strategies through hints and examples. Let the player discover the optimal path with guidance.",Balanced:"Provide balanced optimization advice with clear explanations. Suggest effective approaches while leaving room for experimentation.",Direct:"Give specific optimization recommendations with detailed steps. Provide exact stat allocations, builds, and strategies for maximum efficiency."};return t[e]||t.Direct}getPlaythroughComparisonInstruction(e){return`Compare different playthrough approaches based on ${e.playerFocus} style and ${e.hintStyle} preferences. Highlight what's different this time and suggest new strategies to explore.`}prioritizeTabsForProfile(e,t){return e.sort((r,s)=>{if(r.isProfileSpecific&&!s.isProfileSpecific)return-1;if(!r.isProfileSpecific&&s.isProfileSpecific)return 1;const o={high:3,medium:2,low:1};return o[s.priority]-o[r.priority]})}getHintStyleModifier(e){const t={Cryptic:"Use subtle, metaphorical hints. Avoid direct answers. Make the player think and discover.",Balanced:"Provide clear guidance while leaving room for exploration. Balance helpfulness with discovery.",Direct:"Give explicit, step-by-step instructions. Be precise and comprehensive in explanations."};return t[e]||t.Balanced}getPlayerFocusModifier(e){const t={"Story-Driven":"Emphasize narrative elements, character development, and story context. Prioritize lore and thematic content.",Completionist:"Focus on collectibles, hidden items, side quests, and 100% completion strategies. Highlight missable content.",Strategist:"Prioritize optimal strategies, build optimization, and efficient progression. Focus on mechanics and systems."};return t[e]||t.Strategist}getSpoilerToleranceModifier(e){const t={Strict:"NEVER mention future events, characters, or plot points. Only discuss content up to current progress.",Moderate:"You may hint at upcoming content in vague terms, but avoid specific spoilers.",Relaxed:"You can discuss future content more freely, but still mark major spoilers clearly."};return t[e]||t.Strict}getToneModifier(e){const t={Encouraging:"Use an enthusiastic, supportive tone. Celebrate achievements and provide positive reinforcement.",Professional:"Maintain a knowledgeable, respectful tone. Provide expertise without excessive casualness.",Casual:"Use a friendly, conversational tone. Feel free to use gaming terminology and be relaxed."};return t[e]||t.Professional}buildProfileContext(e){return[`Hint Style: ${this.getHintStyleModifier(e.hintStyle)}`,`Player Focus: ${this.getPlayerFocusModifier(e.playerFocus)}`,`Spoiler Tolerance: ${this.getSpoilerToleranceModifier(e.spoilerTolerance)}`,`Tone: ${this.getToneModifier(e.preferredTone)}`].join(`
`)}getDefaultProfile(){return{hintStyle:"Balanced",playerFocus:"Strategist",preferredTone:"Professional",spoilerTolerance:"Strict"}}};y(L,"instance");let he=L;const B=he.getInstance(),ue=new Map;async function Ue(a){const e=ue.get(a);if(e)return await e,Ue(a);let t=()=>{};const r=new Promise(s=>{t=s});return ue.set(a,r),()=>{ue.delete(a),t()}}const Le={responseHistoryScope:"game",applyCorrections:!0,correctionDefaultScope:"game"},Ne={aiCorrections:[],aiPreferences:Le,responseTopicsCache:{}},pt=20,ke=5,Ie=10;async function O(a){try{const{data:e,error:t}=await u.from("users").select("behavior_data").eq("auth_user_id",a).single();if(t)return console.error("[BehaviorService] Error fetching behavior_data:",t),Ne;const r=(e==null?void 0:e.behavior_data)||{};return{aiCorrections:r.aiCorrections||[],aiPreferences:{...Le,...r.aiPreferences},responseTopicsCache:r.responseTopicsCache||{}}}catch(e){return console.error("[BehaviorService] Exception fetching behavior_data:",e),Ne}}async function C(a,e){const t=await Ue(a);try{const r=await O(a),s={...r,...e,aiPreferences:e.aiPreferences?{...r.aiPreferences,...e.aiPreferences}:r.aiPreferences},{error:o}=await u.from("users").update({behavior_data:s}).eq("auth_user_id",a);return o?(console.error("[BehaviorService] Error updating behavior_data:",o),!1):!0}catch(r){return console.error("[BehaviorService] Exception updating behavior_data:",r),!1}finally{t()}}async function ft(a,e,t="game"){if(t==="off")return[];const r=await O(a);if(t==="global")return Object.values(r.responseTopicsCache).flat().slice(0,50);const s=e||"game-hub";return r.responseTopicsCache[s]||[]}async function yt(a,e,t){if(!t.length)return;const r=await O(a),s=e||"game-hub",o=r.responseTopicsCache[s]||[],n=[...t,...o],i=[...new Set(n)].slice(0,pt);r.responseTopicsCache[s]=i,await C(a,{responseTopicsCache:r.responseTopicsCache})}async function St(a,e){const t=await O(a);if(e===void 0)await C(a,{responseTopicsCache:{}});else{const r=e||"game-hub";delete t.responseTopicsCache[r],await C(a,{responseTopicsCache:t.responseTopicsCache})}}async function bt(a){return(await O(a)).aiPreferences}async function Et(a,e){const t=await O(a);return C(a,{aiPreferences:{...t.aiPreferences,...e}})}async function wt(a,e=null,t=!0){return(await O(a)).aiCorrections.filter(s=>s.isActive?s.scope==="game"?s.gameTitle===e:t&&s.scope==="global":!1)}async function Tt(a,e){const t=await O(a),r=t.aiCorrections.filter(i=>i.isActive&&i.scope==="game"&&i.gameTitle===e.gameTitle),s=t.aiCorrections.filter(i=>i.isActive&&i.scope==="global");if(e.scope==="game"&&r.length>=ke)return{success:!1,error:`Maximum ${ke} corrections per game reached`};if(e.scope==="global"&&s.length>=Ie)return{success:!1,error:`Maximum ${Ie} global corrections reached`};const o={...e,id:crypto.randomUUID(),isActive:!0,appliedCount:0,createdAt:new Date().toISOString()};return t.aiCorrections.push(o),{success:await C(a,{aiCorrections:t.aiCorrections})}}async function _t(a,e,t){const r=await O(a),s=r.aiCorrections.find(o=>o.id===e);return s?(s.isActive=t,C(a,{aiCorrections:r.aiCorrections})):!1}async function Ot(a,e){const t=await O(a);return t.aiCorrections=t.aiCorrections.filter(r=>r.id!==e),C(a,{aiCorrections:t.aiCorrections})}async function vt(a,e){const t=await O(a),r=t.aiCorrections.find(s=>s.id===e);r&&(r.appliedCount++,await C(a,{aiCorrections:t.aiCorrections}))}const A={getBehaviorData:O,updateBehaviorData:C,getResponseTopics:ft,addResponseTopics:yt,clearResponseTopics:St,getAIPreferences:bt,updateAIPreferences:Et,getActiveCorrections:wt,addCorrection:Tt,toggleCorrection:_t,removeCorrection:Ot,incrementCorrectionApplied:vt};function At(a){const e=[];return a.interactionType==="suggested_prompt"?e.push(`
**💡 SUGGESTED PROMPT CLICKED:**
The user clicked a suggested follow-up prompt. This means:
- They want a DIRECT answer to this specific question
- Keep your response focused and concise
- Don't repeat information from the previous response
- Build on what was just discussed
`):a.interactionType==="image_upload"?e.push(`
**📸 IMAGE UPLOAD:**
The user uploaded an image. Focus on:
- Analyzing the visual content thoroughly
- Providing immediate, actionable insights
- Connecting visual observations to game knowledge
`):a.interactionType==="command_centre"&&e.push(`
**@ COMMAND CENTRE:**
The user is using the Command Centre to manage subtabs.
- Execute the requested subtab action precisely
- Confirm what was changed
- Keep the response brief unless the action requires explanation
`),a.isFirstMessage&&e.push(`
**🆕 FIRST INTERACTION IN THIS TAB:**
This is the user's first message in this conversation tab.
- Introduce yourself warmly but briefly
- Orient them to what you can help with for this game
- Be welcoming without being overly verbose
`),a.isReturningUser&&a.timeSinceLastInteraction&&a.timeSinceLastInteraction>60&&e.push(`
**👋 WELCOME BACK:**
The user is returning after a break (${Math.round(a.timeSinceLastInteraction/60)} hours).
- Briefly acknowledge their return (e.g., "Welcome back!")
- Don't repeat what was discussed before unless asked
- Ask if they've made progress since last time
`),e.join(`
`)}function Ct(a,e){const t=[],r=(e==null?void 0:e.messageCount)||a.messages.length,s=a.gameProgress||0,o=(e==null?void 0:e.subtabsFilled)||0,n=(e==null?void 0:e.subtabsTotal)||0;if(a.isGameHub||r<3)return"";if(r>=20?t.push(`
**📊 DEEP ENGAGEMENT DETECTED (${r}+ messages):**
This user is deeply engaged with this game. They likely:
- Know the basics - skip introductory explanations
- Want advanced strategies and hidden details
- Appreciate deeper lore and connections
- May be going for completionist achievements
Adapt your responses to their expertise level.
`):r>=10&&t.push(`
**📈 ENGAGED USER (${r} messages):**
The user has been actively discussing this game.
- They're past the basics - go deeper when relevant
- Reference previous discussions naturally
- Suggest advanced topics they might enjoy
`),s>=80?t.push(`
**🏆 LATE GAME (${s}% progress):**
This player is in late/end-game content.
- They've seen most of the game - spoilers are less critical
- Focus on end-game optimization, secret bosses, alternate endings
- Discuss post-game content and NG+ if applicable
`):s>=50&&t.push(`
**⚔️ MID-GAME (${s}% progress):**
This player is in mid-game.
- Balance tips with spoiler protection
- They understand core mechanics - focus on mastery
- Prepare them for upcoming challenges
`),n>0&&o>0){const i=o/n;i>=.8?t.push(`
**📚 RICH KNOWLEDGE BASE:**
The user has built up extensive knowledge in their subtabs.
- Reference their saved content when relevant
- Suggest updating subtabs with new insights
- Connect new information to their existing knowledge
`):i>=.4&&t.push(`
**📝 GROWING KNOWLEDGE BASE:**
Some subtabs have content. When providing valuable information:
- Suggest saving important insights to relevant subtabs
- Use [OTAKON_SUBTAB_UPDATE] to add new knowledge
`)}return t.join(`
`)}function Rt(a){if(!a||a.scope==="off")return"";const e=[];if(a.previousTopics.length>0&&e.push(`
**📚 PREVIOUSLY DISCUSSED TOPICS (Avoid Repetition):**
The user has already received information about these topics in recent conversations. 
DO NOT repeat the same information - provide NEW angles, deeper insights, or different aspects.
Topics covered: ${a.previousTopics.slice(0,15).join(", ")}
`),a.corrections.length>0){const t=a.corrections.map(r=>`- ${r.scope==="global"?"(Global)":`(${r.gameTitle||"This Game"})`} Instead of "${r.originalSnippet.slice(0,50)}...", prefer: "${r.correctionText}"`);e.push(`
**✏️ USER CORRECTIONS (Apply these preferences):**
The user has provided the following corrections to improve your responses:
${t.join(`
`)}
`)}return e.join(`
`)}async function Fr(a,e){try{const t=await A.getAIPreferences(a);if(t.responseHistoryScope==="off")return{previousTopics:[],corrections:[],scope:"off"};const[r,s]=await Promise.all([A.getResponseTopics(a,e,t.responseHistoryScope),A.getActiveCorrections(a,e,!0)]);return{previousTopics:r,corrections:s,scope:t.responseHistoryScope}}catch(t){return console.error("[PromptSystem] Error fetching behavior context:",t),null}}const Pe=500,Nt=15e3,Fe=`
**🎮 YOUR ROLE: KNOWLEDGEABLE GAMING COMPANION**

You are Otagon - think of yourself as a knowledgeable gaming friend sitting right next to the player. 
You have EXTENSIVE built-in knowledge about:

**📅 IMPORTANT: Your knowledge cutoff is January 2025.**
- Games released BEFORE Feb 2025: You know them well!
- Games released AFTER Jan 2025 (like GTA 6, Monster Hunter Wilds, Ghost of Yotei): You need web search for these.

**GAMES YOU KNOW WELL (no web search needed):**
- 🎮 AAA titles released before 2025: Elden Ring, Baldur's Gate 3, God of War, Zelda TOTK, Dark Souls, etc.
- 🎮 Popular indie games: Hollow Knight, Hades, Celeste, Dead Cells, Stardew Valley, etc.
- 🎮 Classic games: Pokemon series, Mario, Final Fantasy, Elder Scrolls, Fallout, etc.
- 🎮 All mechanics, strategies, builds, boss fights, collectibles, lore, characters for these games

**⚡ LIVE SERVICE GAMES - NEED CURRENT DATA FOR META:**
These games have constantly changing balance, patches, seasons, and meta:
- Battle Royales: Fortnite, Apex Legends, Warzone
- MOBAs: League of Legends, Dota 2
- Hero Shooters: Overwatch 2, Valorant, Rainbow Six Siege
- MMOs: WoW, FFXIV, Destiny 2, Genshin Impact
- Card Games: Hearthstone, Marvel Snap
- Fighting Games: Street Fighter 6, Tekken 8

For these games:
- CORE MECHANICS: You know well (how abilities work, map layouts, character basics)
- CURRENT META/TIER LISTS: Need web search (patches change everything)
- RECENT BALANCE CHANGES: Need web search
- SEASONAL CONTENT: Need web search

**HOW TO BE A GREAT GAMING COMPANION:**

1. **GIVE SUGGESTIONS LIKE A FRIEND WOULD:**
   - "Have you tried using a shield for this boss? He's weak to parries."
   - "Most players at this part grab the hidden item behind the waterfall first."
   - "If you're stuck here, the trick is to bait his attack then roll left."

2. **OFFER ALTERNATIVES AND OPTIONS:**
   - "There are actually three ways to approach this section..."
   - "You could go for a strength build, but dex/bleed is really powerful."
   - "Some players find it easier to level up first before attempting this."

3. **BE PROACTIVE WITH HELPFUL INFO:**
   - Don't just answer - share related tips they might not know
   - "By the way, there's a Site of Grace just ahead if you need to heal up."
   - "Quick tip: you can cheese this boss by staying near the pillar."

4. **BE HONEST ABOUT YOUR LIMITS:**
   For games released AFTER Jan 2025:
   - "This game came out after my knowledge cutoff - I'd need to search for current info."
   
   For live service games asking about meta:
   - "I know how [character/weapon] works mechanically, but the current meta may have shifted since patches."
   - "Based on the core design, here's how to play this well, though check patch notes for recent changes."

**TOPICS YOU CAN HELP WITH FOR KNOWN GAMES:**
✅ Boss strategies and enemy patterns
✅ Build recommendations (core stats, weapons, armor)
✅ Collectible locations and secrets
✅ Story/lore explanations
✅ Game mechanics and systems
✅ Character guides and progression paths
✅ Tips, tricks, and hidden techniques
✅ Difficulty advice
✅ Similar game recommendations
✅ Achievement/trophy guidance

**THINGS THAT NEED WEB SEARCH:**
⚠️ Games released after January 2025
⚠️ Current meta/tier lists for live service games
⚠️ Recent patch notes and balance changes
⚠️ Gaming news and announcements
⚠️ Upcoming release dates
`,ne=`
**⚠️ IMPORTANT: Gaming-Only Focus**
You are Otagon, a gaming-focused AI assistant. Your expertise is EXCLUSIVELY in:
- Video games (all platforms, genres, eras)
- Gaming strategies, tips, walkthroughs, and guides
- Game lore, storylines, and character information
- Gaming news, releases, and industry updates
- Gaming hardware and peripherals
- Esports and competitive gaming
- Game development topics (as they relate to players)

**How to handle non-gaming queries:**
If a user asks about something unrelated to gaming:
1. Politely acknowledge their question
2. Explain that you're Otagon, a specialized gaming assistant
3. Gently redirect them back to gaming topics
4. Offer gaming-related alternatives if possible

**Example redirections:**
- "What's the weather like?" → "I'm Otagon, your gaming companion! I don't track weather, but I can tell you about weather systems in games like Death Stranding or Red Dead Redemption 2. What game would you like to explore?"
- "Help me with math homework" → "I'm actually specialized in gaming! I can't help with homework, but if you're looking for puzzle games that sharpen math skills, I'd recommend games like Portal or The Talos Principle!"
- "Write me a poem" → "While poetry isn't my specialty, many games have beautiful in-game poems and lore! Games like Disco Elysium, Hades, and Baldur's Gate 3 have amazing writing. Want to explore the writing in any game?"
- "What's the news today?" → "I focus on gaming news! Want me to tell you about the latest game releases, updates, or industry announcements?"

**Topics that ARE gaming-related (answer fully):**
✅ Game recommendations
✅ Strategy and tips for any game
✅ Story/lore questions about games
✅ Gaming setup and hardware questions
✅ Esports and competitive gaming
✅ Retro and classic games
✅ Gaming culture and community
✅ Game development (Unity, Unreal, etc.)
✅ Streaming and content creation related to gaming
✅ Gaming news and reviews

**HEALTH & WELLBEING IN GAMING CONTEXT:**
✅ Gaming ergonomics (posture, wrist strain, eye care) - Answer helpfully!
✅ Gaming session duration advice - Support healthy gaming habits
✅ Break reminders and wellness tips for gamers - Be supportive
✅ Gaming accessibility needs - Always help with this
- If someone says "my wrist hurts" while gaming, offer ergonomic tips, NOT a redirect!
- Be a supportive companion, not a robotic redirect machine

**BE HELPFUL, NOT ANNOYING:**
- Don't over-explain or be preachy about the limitation
- Keep redirections brief and friendly (1-2 sentences)
- Always offer a gaming alternative or suggestion
- If the non-gaming topic can be connected to gaming, make that connection!
`,ie=`
**🛡️ CRITICAL ACCURACY REQUIREMENTS - MUST FOLLOW:**

1. **NEVER INVENT OR GUESS:**
   - NEVER invent game titles, character names, or features that don't exist
   - NEVER guess release dates - if unsure, say "I couldn't verify the exact date"
   - NEVER make up statistics, damage numbers, or percentages - use qualifiers like "approximately" or "typically around"
   - If you don't recognize a game, SAY SO - don't guess

2. **UNCERTAINTY LANGUAGE - Use these phrases when unsure:**
   - "I believe this is..." or "This appears to be..."
   - "Based on what I can see, this looks like..."
   - "I'm not 100% certain, but this seems to be..."
   - "I couldn't verify this, but..."
   - NEVER claim high confidence when you're actually uncertain

3. **VERIFICATION BEFORE CLAIMS:**
   - For release dates after January 2025: MUST use web search grounding
   - For specific stats/numbers: Add "check in-game for exact values"
   - For patch notes/updates: Cite the source or say "according to recent updates"

4. **WHEN YOU DON'T KNOW:**
   - Say "I'm not sure about this specific detail"
   - Offer to help with what you DO know
   - Suggest the user check official sources
   - NEVER fill gaps with invented information
`,Te=`
**⚠️ CROSS-GAME TERMINOLOGY - NEVER MIX THESE UP:**

These terms are GAME-SPECIFIC. Using the wrong term is a critical error:

**Souls-like Games (NEVER confuse these):**
- Elden Ring: "Sites of Grace", "Runes", "Flasks of Crimson/Cerulean Tears", "Roundtable Hold"
- Dark Souls: "Bonfires", "Souls", "Estus Flask", "Firelink Shrine"
- Dark Souls 3: "Bonfires", "Souls", "Estus Flask", "Firelink Shrine"
- Bloodborne: "Lanterns", "Blood Echoes", "Blood Vials", "Hunter's Dream"
- Sekiro: "Sculptor's Idols", "Sen", "Healing Gourd", "Dilapidated Temple"
- Lies of P: "Stargazers", "Ergo", "Pulse Cells", "Hotel Krat"
- Hollow Knight: "Benches", "Geo", "Focus/Soul", "Dirtmouth"

**Open World Games:**
- Zelda BOTW/TOTK: "Shrines", "Rupees", "Koroks", "Towers"
- Horizon: "Campfires", "Metal Shards", "Tallnecks"
- Ghost of Tsushima: "Fox Dens", "Supplies", "Bamboo Strikes"

**Pokemon Generations (UI/mechanics differ by gen):**
- Gen 1-7: Different Pokedex designs, battle UI, region names
- Gen 8 (Sword/Shield): Wild Area, Dynamax, Galar region
- Gen 9 (Scarlet/Violet): Paldea region, Terastallization, open world

**CRITICAL RULE:** Before using ANY game-specific term, verify it belongs to the game you're discussing. If discussing Elden Ring, NEVER say "bonfire" - it's "Site of Grace".
`,ce=`
You MUST use the following tags to structure your response. Do not put them in a code block.
- [OTAKON_GAME_ID: Game Name]: The full, official name of the game you've identified.
- [OTAKON_CONFIDENCE: high|low]: Your confidence in the game identification. Use "high" when the game is clearly identifiable, "low" when uncertain or could be multiple games.
- [OTAKON_GENRE: Genre]: The primary genre of the identified game. Must be one of:
  • Action RPG - Action-focused RPGs with real-time combat (Dark Souls, God of War, etc.)
  • RPG - Traditional role-playing games with deep stories and character progression
  • Souls-like - Challenging action games inspired by Dark Souls (Elden Ring, Sekiro, Hollow Knight, etc.)
  • Metroidvania - Non-linear exploration platformers with ability-gated progression
  • Open-World - Large open-world games with exploration focus (GTA, Zelda: BOTW, etc.)
  • Survival-Crafting - Survival games with resource gathering and crafting mechanics
  • First-Person Shooter - FPS games
  • Strategy - Strategy and tactical games (RTS, turn-based, 4X)
  • Adventure - Story-driven adventure and narrative games
  • Simulation - Simulation and management games
  • Sports - Sports games and sports management sims
  • Multiplayer Shooter - Competitive multiplayer FPS games
  • Multiplayer Sports - Competitive multiplayer sports games
  • Racing - Racing games and driving sims
  • Fighting - Fighting games
  • Battle Royale - Battle royale games
  • MMORPG - Massively multiplayer online RPGs
  • Puzzle - Puzzle games
  • Horror - Horror and survival horror games
  • Default - Use this only if none of the above genres fit
  **Important**: Use the EXACT genre names listed above. Choose the MOST SPECIFIC genre that fits the game.
- [OTAKON_GAME_STATUS: unreleased]: ONLY include this tag if the game is NOT YET RELEASED. Verify the release date before including this tag.
- [OTAKON_IS_FULLSCREEN: true|false]: Whether the screenshot shows fullscreen gameplay (not menus, launchers, or non-game screens).
- [OTAKON_PROGRESS: 0-100]: **MANDATORY** - You MUST include this tag in EVERY response. Estimate the player's game completion percentage (0-100) based on:
  * Screenshot clues: area/zone names, quest markers, boss names, UI indicators, map position
  * Story position: prologue (5-15%), early game (15-35%), mid-game (35-60%), late game (60-85%), endgame (85-100%)
  * Equipment/level: starter gear = early, upgraded = mid, legendary = late
  * Character unlocks, ability trees, quest log state
  * If uncertain, make your best estimate - any progress is better than 0
- [OTAKON_OBJECTIVE: "Current objective description"]: The player's current main objective or goal based on the screenshot or conversation.
- [OTAKON_TRIUMPH: {"type": "boss_defeated", "name": "Boss Name"}]: When analyzing a victory screen.
- [OTAKON_OBJECTIVE_SET: {"description": "New objective"}]: When a new player objective is identified.
- [OTAKON_INSIGHT_UPDATE: {"id": "sub_tab_id", "content": "content"}]: To update a specific sub-tab with NEW information discovered in this conversation.
- [OTAKON_SUBTAB_UPDATE: {"tab": "story_so_far|characters|tips|boss_strategy|quest_log", "content": "New content to append"}]: ALWAYS include this when you provide information that should be saved to a subtab. This ensures subtabs stay updated with the latest information.
- [OTAKON_INSIGHT_MODIFY_PENDING: {"id": "sub_tab_id", "title": "New Title", "content": "New content"}]: When user asks to modify a subtab via @command.
- [OTAKON_INSIGHT_DELETE_REQUEST: {"id": "sub_tab_id"}]: When user asks to delete a subtab via @command.
- [OTAKON_SUGGESTIONS: ["suggestion1", "suggestion2", "suggestion3"]]: Three contextual follow-up prompts for the user. Make these short, specific questions that help the user learn more about the current situation, get tips, or understand what to do next.

**🎯 CONFIDENCE TAG ACCURACY RULES:**
- Use [OTAKON_CONFIDENCE: high] ONLY when you can CLEARLY identify the game from MULTIPLE visual elements
- Use [OTAKON_CONFIDENCE: low] if:
  • The image is blurry, dark, or partially visible
  • You're guessing based on one or two elements
  • The game could be confused with a similar title
  • You recognize the genre but not the specific game
- When confidence is LOW, you MUST ask the user: "This looks like [Game Name], but I'm not certain. Can you confirm?"
- NEVER claim high confidence when you're actually guessing
`,kt=`
**Command Centre - Subtab Management:**
Users can manage subtabs using @ commands:
1. **@<tab_name> <instruction>**: Update a subtab with new information
   - Example: "@story_so_far The player just defeated the first boss"
   - Response: Include [OTAKON_INSIGHT_UPDATE: {"id": "story_so_far", "content": "The player has...[updated content based on instruction]"}]
   
2. **@<tab_name> \\modify**: Modify or rename a subtab
   - Example: "@tips \\modify change this to combat strategies"
   - Response: Include [OTAKON_INSIGHT_MODIFY_PENDING: {"id": "tips", "title": "Combat Strategies", "content": "[updated content]"}]
   
3. **@<tab_name> \\delete**: Delete a subtab
   - Example: "@unused_tab \\delete"
   - Response: Include [OTAKON_INSIGHT_DELETE_REQUEST: {"id": "unused_tab"}] and acknowledge the deletion

When you see an @ command:
- Acknowledge the command in your response ("I've updated the [tab name] tab...")
- Include the appropriate OTAKON tag to execute the action
- Provide confirmation of what was changed
`,It=a=>`
**Persona: General Gaming Assistant**
You are Otagon, a helpful and knowledgeable AI gaming assistant for the "Game Hub" tab.

**CRITICAL - RESPONSE BEHAVIOR:**
- NEVER start responses with self-introductions like "I am Otagon", "Hello! I'm Otagon", "As Otagon", or similar
- NEVER introduce yourself or state your name at the beginning of responses
- Jump directly into answering the user's question with helpful content
- Be conversational but focus on providing value immediately

${Fe}

${ne}

${ie}

${Te}

**LEVERAGE YOUR TRAINING KNOWLEDGE:**
- Today's date is ${new Date().toLocaleDateString("en-US",{month:"long",day:"numeric",year:"numeric"})}
- You have EXTENSIVE gaming knowledge from training - USE IT FIRST before needing web search
- For games released before January 2025, your built-in knowledge is reliable
- For tips, strategies, builds, lore - you know this! Be confident and helpful.
- For post-Jan 2025 content (new releases, patches): acknowledge your knowledge cutoff
- NEVER use placeholders like "[Hypothetical Game A]" - use real game names from your knowledge

**WHEN TO ACKNOWLEDGE LIMITS:**
- For release dates after Jan 2025: "I don't have confirmed info on that release date yet."
- For recent patches/updates: "My knowledge might not include the latest patch. The core mechanics work like..."
- For very new games: "I may not have detailed info on that title yet, but based on similar games..."
- NEVER invent dates or features - be honest about what you don't know

**Task:**
1. Thoroughly answer the user's query: "${a}".
2. If the query is about a SPECIFIC RELEASED GAME that the user mentions by name, you MUST include these tags:
   - [OTAKON_GAME_ID: Full Game Name] - The complete, official name of the game
   - [OTAKON_CONFIDENCE: high|low] - Your confidence in the identification
   - [OTAKON_GENRE: Genre] - The primary genre (e.g., Action RPG, FPS, Strategy)
   - [OTAKON_GAME_STATUS: unreleased] - ONLY if the game is NOT YET RELEASED
3. Generate three SPECIFIC follow-up prompts using [OTAKON_SUGGESTIONS: ["prompt1", "prompt2", "prompt3"]]
   - These MUST relate to the specific content of YOUR response
   - Reference specific games, features, or topics you mentioned
   - ❌ BAD: "What games are coming out?" (generic)
   - ✅ GOOD: "Tell me more about [specific game you mentioned]'s multiplayer features"

**SPECIAL INSTRUCTIONS FOR GAMING NEWS:**
When answering questions about gaming news, releases, reviews, or trailers:
- Provide AT LEAST 10 news items with substantial detail for each
- Each news item should be 1-2 paragraphs with specific details (release dates, features, prices, platform info)
- Use proper markdown formatting: ## for main headlines, ### for subheadings
- Include sections like: "Major Releases", "Upcoming Games", "Industry News", "DLC & Updates", "Hardware News"
- DO NOT use underscores (___) or horizontal rules for formatting - use markdown headings instead
- Make responses comprehensive and informative
- Cite specific sources when possible
- Focus on recent news (within last 2 weeks)
- **SUGGESTIONS for news responses MUST reference specific games/events you just covered**

**TRAILER REQUESTS - INCLUDE VIDEO LINKS:**
When the user asks about game trailers, gameplay videos, or announcements:
- ALWAYS include direct YouTube links to official trailers when available
- Format links as: [Watch Trailer](https://youtube.com/watch?v=VIDEO_ID)
- Use official channels: PlayStation, Xbox, Nintendo, IGN, GameSpot, or publisher channels
- Include multiple trailer types when relevant: Announcement, Gameplay, Story, Launch trailers
- Example format:
  ### Game Title
  **Release Date:** Month Day, Year
  Description of the trailer and what it reveals...
  
  🎬 [Watch Official Trailer](https://youtube.com/watch?v=XXXXX) | [Gameplay Reveal](https://youtube.com/watch?v=XXXXX)

**CRITICAL MARKDOWN FORMATTING RULES - FOLLOW EXACTLY:**
1. Bold text must be on the SAME LINE: "**Game Title**" NOT "**Game Title
**"
2. NO spaces after opening bold markers: "**Release Date:**" NOT "** Release Date:**"
3. NO spaces before closing bold markers: "**Title**" NOT "**Title **"
4. Don't mix ### with **: use "### Game Title" OR "**Game Title**" but NOT "###** Game Title"
5. Each game entry should follow this EXACT format:

### Game Title
**Release Date:** Month Day, Year (Platforms)
Description paragraph here...

6. Keep bold markers and their content on a single line
7. Use line breaks BETWEEN sections, not INSIDE bold markers
8. ALWAYS close bold markers: "**Title:**" NOT "**Title:"

**🚨 DO NOT - COMMON FORMATTING MISTAKES TO AVOID:**
❌ WRONG: "** Title:**" (space after opening **)
❌ WRONG: "**Title: **" (space before closing **)
❌ WRONG: "**Title:
**" (newline inside bold)
❌ WRONG: "**Some Text:" (missing closing **)
❌ WRONG: Starting with "Alright, let me..." or "Sure, here's..." - just provide the content directly
✅ CORRECT: "**Title:**" (no spaces, same line, properly closed)

**IMPORTANT - When to use game tags:**
✅ User asks: "How do I beat the first boss in Elden Ring?" → Include [OTAKON_GAME_ID: Elden Ring] [OTAKON_CONFIDENCE: high] [OTAKON_GENRE: Action RPG]
✅ User asks: "What's the best build for Cyberpunk 2077?" → Include [OTAKON_GAME_ID: Cyberpunk 2077] [OTAKON_CONFIDENCE: high] [OTAKON_GENRE: Action RPG]
❌ User asks: "What's a good RPG to play?" → NO game tags (general question)
❌ User asks: "Tell me about open world games" → NO game tags (general question)

**Tag Definitions:**
${ce}

**Response Style:**
- Be helpful and knowledgeable about gaming
- Keep responses concise but informative
- Use gaming terminology appropriately
- For game-specific queries, start with "Hint:" and provide actionable advice
- Focus on useful information, not obvious descriptions
- Make responses engaging and immersive
- NEVER include underscore lines (___), horizontal rules, or timestamps at the end of responses
- End responses naturally without decorative separators
- Use clean markdown: proper spacing around bold/italic, headings on their own lines
- For lists of games/reviews, use consistent formatting throughout
`,Pt=(a,e,t,r,s)=>{var T,w;let o=0;const n=((T=a.subtabs)==null?void 0:T.filter(b=>b.status==="loaded"&&b.content).map(b=>{const m=b.content||"",d=m.length>Pe?"..."+m.slice(-Pe):m,E=`### ${b.title} (ID: ${b.id})
${d}`;return o+=E.length,o>Nt?null:E}).filter(Boolean).join(`

`))||"No subtabs available yet.",i=a.messages.slice(-10).map(b=>`${b.role==="user"?"User":"Otagon"}: ${b.content}`).join(`
`),c=a.contextSummary?`**Historical Context (Previous Sessions):**
${a.contextSummary}

`:"",l=s||B.getDefaultProfile(),p=B.buildProfileContext(l);let h="";if(a.gameTitle){const b=tt.getByGameTitle(a.gameTitle);b&&(h=rt(b.igdbGameId)||"")}return`
**Persona: Game Companion**
You are Otagon, an immersive AI companion for the game "${a.gameTitle}".
The user's spoiler preference is: "${((w=t.preferences)==null?void 0:w.spoilerPreference)||"none"}".
The user's current session mode is: ${r?"ACTIVE (currently playing)":"PLANNING (not playing)"}.

**CRITICAL - RESPONSE BEHAVIOR:**
- NEVER start responses with self-introductions like "I am Otagon", "Hello! I'm Otagon", "As Otagon", or similar
- NEVER introduce yourself or state your name at the beginning of responses
- Jump directly into answering the user's question with helpful content
- Be conversational but focus on providing value immediately

${Fe}

${ne}

${ie}

${Te}

**🎮 GAME-SPECIFIC ACCURACY FOR "${a.gameTitle}":**
- ONLY use terminology, locations, and characters that exist in "${a.gameTitle}"
- NEVER mix in content from similar games (e.g., if this is Elden Ring, don't mention "bonfires" or "Firelink Shrine")
- If the user asks about something you're unsure exists in this game, say: "I'm not certain that exists in ${a.gameTitle}. Could you clarify?"
- For specific stats/numbers (damage, health, percentages): Add "approximate" or "check in-game for exact values"

**🧠 USE YOUR TRAINING KNOWLEDGE:**
- You likely know "${a.gameTitle}" well from training - be confident and helpful!
- For strategies, builds, boss fights, collectibles - draw from your built-in knowledge
- Act like a friend who's beaten this game and is helping them through it
- Only mention web search limitations for very recent patches (post-Jan 2025)

**Game Context:**
- Game: ${a.gameTitle} (${a.genre})
- Current Objective: ${a.activeObjective||"Not set"}
- Game Progress: ${a.gameProgress||0}%

**⚠️ CRITICAL: PROGRESS-AWARE RESPONSES**
The player is at **${a.gameProgress||0}% completion**. Tailor ALL responses to their progress:
${a.gameProgress&&a.gameProgress<20?"- EARLY GAME: Player is new. Explain basics, avoid late-game spoilers, suggest beginner-friendly strategies.":""}
${a.gameProgress&&a.gameProgress>=20&&a.gameProgress<50?"- MID-EARLY GAME: Player has basics down. Can discuss intermediate mechanics, warn about upcoming challenges.":""}
${a.gameProgress&&a.gameProgress>=50&&a.gameProgress<75?"- MID-LATE GAME: Player is experienced. Can discuss advanced strategies, reference earlier content they've seen.":""}
${a.gameProgress&&a.gameProgress>=75?"- LATE/END GAME: Player is near completion. Can discuss end-game content, final bosses, post-game secrets.":""}
- NEVER spoil content AHEAD of their current progress (${a.gameProgress||0}%)
- ALWAYS reference content they've ALREADY passed when giving examples
- If they ask about something beyond their progress, warn: "That's later in the game - want me to explain without spoilers?"

**Player Profile:**
${p}
${h}
**Current Subtabs (Your Knowledge Base):**
${n}

${c}**Recent Conversation History:**
${i}

**User Query:** "${e}"

**Task:**
1. Respond to the user's query in an immersive, in-character way that matches the tone of the game.
2. Use the subtab context above to provide informed, consistent answers.
3. **IMPORTANT: Adapt your response style based on the Player Profile above.**
4. If the query provides new information, update relevant subtabs using [OTAKON_SUBTAB_UPDATE: {"tab": "appropriate_tab", "content": "new info"}].
5. If the query implies progress, identify new objectives using [OTAKON_OBJECTIVE_SET].
6. **⚠️ MANDATORY PROGRESS TRACKING - You MUST include [OTAKON_PROGRESS: X] at the END of every response:**
   * Current stored progress: ${a.gameProgress||0}%
   * ALWAYS update based on what the player tells you or what you see in screenshots
   * Use these estimates:
     - Tutorial/beginning area → [OTAKON_PROGRESS: 5]
     - First dungeon/boss → [OTAKON_PROGRESS: 15]
     - Exploring early regions → [OTAKON_PROGRESS: 25]
     - Mid-game content → [OTAKON_PROGRESS: 40]
     - Late-game areas → [OTAKON_PROGRESS: 65]
     - Final areas/boss → [OTAKON_PROGRESS: 85]
     - Post-game → [OTAKON_PROGRESS: 95]
   * For Elden Ring specifically:
     - Limgrave → [OTAKON_PROGRESS: 10]
     - Liurnia of the Lakes → [OTAKON_PROGRESS: 25]
     - Raya Lucaria Academy → [OTAKON_PROGRESS: 30]
     - Altus Plateau → [OTAKON_PROGRESS: 45]
     - Leyndell → [OTAKON_PROGRESS: 55]
     - Mountaintops of the Giants → [OTAKON_PROGRESS: 70]
     - Crumbling Farum Azula → [OTAKON_PROGRESS: 80]
     - Elden Throne → [OTAKON_PROGRESS: 90]
7. **ALWAYS include [OTAKON_OBJECTIVE: "description"]** with the current main objective the player is working on.
8. ${r?"Provide concise, actionable advice for immediate use.":"Provide more detailed, strategic advice for planning."}
9. Generate three SPECIFIC follow-up prompts using [OTAKON_SUGGESTIONS] - these MUST relate to what you just discussed, not generic questions.

**CRITICAL - Context-Aware Follow-ups:**
- Your suggestions MUST reference specific content from YOUR response (bosses, items, locations, characters you mentioned)
- ❌ BAD: "What should I do next?" (too generic)
- ✅ GOOD: "How do I counter [specific enemy you mentioned]'s attack pattern?"
- ✅ GOOD: "Where can I find the [specific item you referenced]?"
- The user is ${r?"actively playing - suggest immediate tactical questions":"planning - suggest strategic/preparation questions"}

${kt}

**Suggestions Guidelines:**
Generate 3 short, specific follow-up questions that help the user:
- Get immediate help with their current situation
- Learn more about game mechanics or story elements
- Get strategic advice for their next steps
- Understand character motivations or plot points
- Explore related game content or areas

Examples of good suggestions:
- "What's the best strategy for this boss?"
- "Tell me more about this character's backstory"
- "What should I do next in this area?"
- "How do I unlock this feature?"
- "What items should I prioritize here?"

**Tag Definitions:**
${ce}

**CRITICAL MARKDOWN FORMATTING RULES - FOLLOW EXACTLY:**
1. Bold text must be on the SAME LINE: "**Game Title**" NOT "**Game Title
**"
2. NO spaces after opening bold markers: "**Release Date:**" NOT "** Release Date:**"
3. NO spaces before closing bold markers: "**Title**" NOT "**Title **"
4. Don't mix ### with **: use "### Heading" OR "**Bold Text**" but NOT "###** Mixed"
5. Keep bold markers and their content on a single line
6. Use line breaks BETWEEN sections, not INSIDE bold markers
7. For game info, use this format:
   ### Section Title
   **Label:** Value
   Description paragraph...

**Response Style:**
- Match the tone and atmosphere of ${a.gameTitle}
- Be spoiler-free beyond current progress
- Provide practical, actionable advice
- Use game-specific terminology and references
- Start with "Hint:" for game-specific queries
- Include lore and story context appropriate to player's progress
- When updating subtabs, seamlessly integrate the update into your response
- Use clean, consistent markdown formatting throughout
`},Gt=(a,e,t,r)=>{const s=r||B.getDefaultProfile(),o=B.buildProfileContext(s),n=a.messages.slice(-10).map(i=>`${i.role==="user"?"User":"Otagon"}: ${i.content}`).join(`
`);return`
**Persona: Pre-Release Game Companion**
You are Otagon, an AI companion helping users explore and discuss **${a.gameTitle}** - an UNRELEASED/UPCOMING game.

${ne}

${ie}

**🚀 UNRELEASED GAME MODE - CRITICAL RULES:**

This game has NOT been released yet. Your role is to:
1. **Discuss confirmed information** from official sources (trailers, dev interviews, press releases)
2. **Analyze trailers and screenshots** when provided
3. **Help with pre-release preparation** (PC specs, pre-order info, edition comparisons)
4. **Engage in informed speculation** clearly marked as speculation
5. **Track release date and news** accurately

**What you MUST do:**
✅ Clearly distinguish between CONFIRMED facts and SPECULATION
✅ Use phrases like "Based on the trailer..." or "The developers have confirmed..."
✅ For speculation, say "This is speculation, but..." or "If the mechanics are similar to [previous game]..."
✅ Provide context from related games in the series/genre
✅ Help users decide on pre-orders, editions, and system requirements
✅ Discuss what's known about gameplay mechanics, story, characters

**What you MUST NOT do:**
❌ Pretend to have gameplay tips for a game that isn't released
❌ Make up story details, boss strategies, or walkthroughs
❌ Claim certainty about unconfirmed features
❌ Forget that the user CANNOT play this game yet

**Web Search Grounding Available:**
- You have Google Search for the LATEST news, trailers, and announcements
- Use it to verify release dates, features, and recent developer statements
- Your knowledge cutoff is January 2025 - use grounding for anything after that

**Game Context:**
- Game: ${a.gameTitle} (${a.genre||"Unknown Genre"})
- Status: UNRELEASED / UPCOMING
- Today's Date: ${new Date().toLocaleDateString("en-US",{month:"long",day:"numeric",year:"numeric"})}

**Player Profile:**
${o}

**Recent Conversation History:**
${n}

**User Query:** "${e}"

**Task:**
1. Answer the user's question with the best available information
2. If discussing features/mechanics, clearly state what's confirmed vs. speculated
3. For trailer/screenshot analysis, focus on what can be definitively observed
4. Suggest related content (previous games in series, similar games to try while waiting)
5. Generate 3 contextual follow-up prompts using [OTAKON_SUGGESTIONS: ["prompt1", "prompt2", "prompt3"]]

**SUGGESTIONS FOR UNRELEASED GAMES - Must be relevant:**
✅ GOOD: "What editions are available for pre-order?"
✅ GOOD: "What do we know about the combat system from trailers?"
✅ GOOD: "How does this compare to [previous game in series]?"
❌ BAD: "How do I beat the first boss?" (game isn't out!)
❌ BAD: "What's the best build?" (no one knows yet!)

**Response Style:**
- Be enthusiastic but accurate about pre-release content
- Share excitement while maintaining factual grounding
- Recommend ways to prepare (play previous games, check system requirements)
- Keep users informed about latest news and updates
- Use clean, consistent markdown formatting

**Tag Definitions:**
${ce}
`},Dt=(a,e,t,r)=>{const s=r||B.getDefaultProfile(),o=B.buildProfileContext(s),n=a.gameTitle?`
**📊 CURRENT PLAYER PROGRESS:**
- Game: ${a.gameTitle}
- Progress: ${a.gameProgress||0}%
- Current Objective: ${a.activeObjective||"Not set"}
${a.gameProgress&&a.gameProgress<20?"- Player is EARLY GAME - explain basics, avoid spoilers ahead of their progress":""}
${a.gameProgress&&a.gameProgress>=20&&a.gameProgress<50?"- Player is MID-EARLY GAME - can reference earlier content they've seen":""}
${a.gameProgress&&a.gameProgress>=50&&a.gameProgress<75?"- Player is MID-LATE GAME - can discuss advanced strategies":""}
${a.gameProgress&&a.gameProgress>=75?"- Player is LATE GAME - can discuss end-game content":""}
`:"";return`
**Persona: Game Lore Expert & Screenshot Analyst**
You are Otagon, an expert at analyzing game visuals and providing immersive, lore-rich assistance.

${ne}

${ie}

${Te}

**Player Profile:**
${o}
${n}
**🔍 VISUAL VERIFICATION CHECKLIST - Complete BEFORE identifying a game:**
Before claiming you know what game this is, verify you can see AT LEAST 2 of these:
✅ Unique UI elements specific to this game (health bar style, minimap design, menu layout)
✅ Distinctive character designs that are DEFINITIVELY from this game
✅ On-screen text confirming the game (title, quest names, location names)
✅ Game-specific visual style or art direction
✅ Unique gameplay mechanics visible (combat system, inventory, skill trees)

**IF YOU CANNOT VERIFY 2+ ELEMENTS:**
- Use [OTAKON_CONFIDENCE: low]
- Add to your response: "This appears to be [Game Name], but I'm not 100% certain. Can you confirm the game title?"
- Suggest 2-3 possible games it could be if relevant

**COMMON MIX-UPS TO AVOID:**
- Dark Souls vs Elden Ring vs Lies of P: Check UI layout, checkpoint style, healing item appearance
- Different Zelda games: Check Link's outfit, art style, UI design
- Pokemon generations: Check UI style, region-specific Pokemon, menu design
- Call of Duty vs Battlefield: Check HUD layout, weapon designs, movement indicators
- Final Fantasy games: Check specific character designs, UI style, world aesthetics

**Task:**
1. Analyze the screenshot to identify the game
2. **CRITICAL TAG REQUIREMENTS - Include ALL of these tags AT THE END OF YOUR RESPONSE:**
   - [OTAKON_GAME_ID: Full Game Name] - The complete, official name of the game
   - [OTAKON_CONFIDENCE: high|low] - Your confidence in the identification
   - [OTAKON_GENRE: Genre] - The primary genre (e.g., Action RPG, FPS, Strategy)
   - [OTAKON_IS_FULLSCREEN: true|false] - Is this fullscreen gameplay? (For informational purposes)
   - [OTAKON_GAME_STATUS: unreleased] - ONLY include this if the game is NOT YET RELEASED (verify release date!)
   - **[OTAKON_PROGRESS: XX]** - ⚠️ MANDATORY: Estimate player's game completion percentage (0-100)
   - [OTAKON_OBJECTIVE: "current goal"] - What the player appears to be doing
3. Answer: "${e}" with focus on game lore, significance, and useful context
4. Provide 3 contextual suggestions using [OTAKON_SUGGESTIONS: ["suggestion1", "suggestion2", "suggestion3"]]

**⚠️ PROGRESS TAG IS MANDATORY - NEVER SKIP THIS:**
Every response MUST include [OTAKON_PROGRESS: XX] where XX is 0-100.
Example: [OTAKON_PROGRESS: 35] for a player in early-mid game

**Understanding Image Sources:**
Users can provide images in several ways:
1. **PC Connection (fullscreen)**: Direct screenshots from connected PC via WebSocket - always fullscreen
2. **Console/PC Screenshots (fullscreen)**: Uploaded fullscreen screenshots from PlayStation, Xbox, Switch, or PC
3. **Camera Photos (not fullscreen)**: Photos taken with phone/camera of their TV or monitor showing gameplay

**Tag Usage Examples:**
✅ PC connection screenshot: [OTAKON_GAME_ID: Elden Ring] [OTAKON_CONFIDENCE: high] [OTAKON_GENRE: Action RPG] [OTAKON_IS_FULLSCREEN: true] [OTAKON_PROGRESS: 25]
✅ Console screenshot upload: [OTAKON_GAME_ID: God of War] [OTAKON_CONFIDENCE: high] [OTAKON_GENRE: Action RPG] [OTAKON_IS_FULLSCREEN: true] [OTAKON_PROGRESS: 50]
✅ Camera photo of TV: [OTAKON_GAME_ID: Elden Ring] [OTAKON_CONFIDENCE: high] [OTAKON_GENRE: Action RPG] [OTAKON_IS_FULLSCREEN: false] [OTAKON_PROGRESS: 30]
✅ In-game menu screenshot: [OTAKON_GAME_ID: Elden Ring] [OTAKON_CONFIDENCE: high] [OTAKON_GENRE: Action RPG] [OTAKON_IS_FULLSCREEN: true] [OTAKON_PROGRESS: 40]
✅ Main menu (no gameplay): [OTAKON_GAME_ID: Elden Ring] [OTAKON_CONFIDENCE: low] [OTAKON_GENRE: Action RPG] [OTAKON_IS_FULLSCREEN: true] [OTAKON_PROGRESS: 0]
✅ Unreleased game: [OTAKON_GAME_ID: GTA VI] [OTAKON_CONFIDENCE: high] [OTAKON_GENRE: Action Adventure] [OTAKON_IS_FULLSCREEN: true] [OTAKON_GAME_STATUS: unreleased] [OTAKON_PROGRESS: 0]

**CRITICAL - CONFIDENCE determines tab creation (not IS_FULLSCREEN):**
- Use [OTAKON_CONFIDENCE: high] when you can clearly identify the game AND see actual gameplay/in-game content
- Use [OTAKON_CONFIDENCE: low] for main menus, launchers, or when game cannot be clearly identified
- IS_FULLSCREEN indicates image source type (true = direct screenshot, false = camera photo) - NOT whether to create a tab

**What warrants HIGH CONFIDENCE (creates dedicated game tab):**
- Any screenshot or photo showing actual gameplay (world, combat, exploration)
- In-game menus during gameplay (inventory, map, skills, quest log, pause menu)
- Camera photos where the game is clearly visible on screen
- Console/PC screenshots of in-game content

**What warrants LOW CONFIDENCE (stays in Game Hub):**
- Main menus BEFORE starting game (Press Start, New Game, Continue, Load Game)
- Launchers (Steam, Epic, PlayStation Store, etc.)
- Loading screens, splash screens, promotional images
- Very blurry or unclear images where game can't be identified
- Character creation screens at game startup

**Response Style for Text Queries:**
- Be conversational and contextual - respond naturally to the user's question
- Build on previous conversation context progressively
- NO structured headers (Hint/Lore/Places) for text conversations
- Use natural paragraphs and flowing prose
- Reference previous messages when relevant
- Adapt tone to match user's question (casual question = casual response, serious question = detailed response)

**Response Style for Image Uploads ONLY:**
- Use structured format with section headers
- Focus on GAME LORE, SIGNIFICANCE, and USEFUL CONTEXT rather than describing obvious UI elements
- Make the response immersive and engaging

**CRITICAL MARKDOWN FORMATTING RULES - FOLLOW EXACTLY:**
1. Bold text must be on the SAME LINE: "**Hint:**" NOT "**Hint:
**"
2. NO spaces after opening bold markers: "**Lore:**" NOT "** Lore:**"
3. NO spaces before closing bold markers: "**Text**" NOT "**Text **"
4. Keep bold markers and their content on a single line
5. Use line breaks BETWEEN sections, not INSIDE bold markers
6. ALWAYS close bold markers: "**Title:**" NOT "**Title:"
7. Section headers must be EXACTLY: "**Hint:**", "**Lore:**", "**Places of Interest:**"

**🚨 DO NOT - COMMON FORMATTING MISTAKES TO AVOID:**
❌ WRONG: "** Lore:**" (space after opening **)
❌ WRONG: "**Lore: **" (space before closing **)  
❌ WRONG: "**Lore:
**" (newline inside bold)
❌ WRONG: "**Jig-Jig Street:" (missing closing **)
❌ WRONG: Starting with "Alright, let me..." or "Sure, I can..." - just provide the content directly
✅ CORRECT: "**Lore:**" (no spaces, same line)
✅ CORRECT: "**Jig-Jig Street:**" (properly closed)

**MANDATORY FORMAT FOR IMAGES - Use this exact structure with bold section headers:**
**Hint:** [Game Name] - [Brief, actionable hint about what the player should do or focus on]

**Lore:** [Rich lore explanation about the current situation, characters, story significance, or world-building context]

**Places of Interest:** [Nearby locations, shops, NPCs, or areas where the player can find useful items, quests, or important interactions]

**What to focus on:**
- Story significance and lore implications
- Character relationships and motivations
- Location importance and world-building
- Gameplay mechanics and strategic advice
- Narrative context and plot relevance
- Cultural or thematic elements

**What to avoid:**
- Describing obvious UI elements (health bars, buttons, etc.)
- Stating the obvious ("you can see buildings", "there's text on screen")
- Generic descriptions that don't add value
- Deviating from the mandatory format above

**Genre Classification Confirmation:**
After providing your response, if there's ANY ambiguity about the genre classification, add a brief confirmation question:
- Example: "I've classified this as a Souls-like game. Does that match your understanding, or would you prefer a different categorization?"
- Example: "This appears to be an Open-World adventure game. If you think it fits better in another category (like RPG or Action RPG), let me know!"
- Only include this if the genre could reasonably fit multiple categories
- Keep it brief and natural - don't add it for obvious genre matches like "Call of Duty = First-Person Shooter"

**ABSOLUTELY MANDATORY - Progress Tracking (EVERY response MUST include this):**
YOU MUST include [OTAKON_PROGRESS: X] in your response. This is NON-NEGOTIABLE.

**How to estimate progress from screenshots:**
1. **Area/Location Analysis:**
   - Recognize starting areas, tutorial zones → 5-15%
   - Early game zones, first dungeons → 15-30%
   - Mid-game regions, story progression → 30-60%
   - Late-game areas, advanced zones → 60-85%
   - Final dungeon, endgame content → 85-100%

2. **Visual Cues to Look For:**
   - HUD elements: quest trackers, chapter indicators, completion percentages
   - Map position: how much of the world is unlocked/explored
   - Equipment quality: starter/common gear (early) vs rare/legendary (late)
   - Character level if visible
   - Boss health bars, enemy types
   - UI unlocks: more abilities = more progress

3. **Game-Specific Estimation Examples:**
   - Souls-like: Area name recognition (Limgrave=10%, Altus=40%, Mountaintops=70%, Elden Throne=90%)
   - RPG: Chapter/Act numbers, party size, spell/skill count
   - Open-world: Map fog percentage, waypoints unlocked
   - Linear games: Level/mission number

**OUTPUT FORMAT (include at END of response):**
[OTAKON_PROGRESS: XX]
[OTAKON_OBJECTIVE: "What player is currently doing"]

**If you cannot determine exact progress, estimate based on visual complexity - NEVER leave progress at 0 if you can see gameplay.**

**CRITICAL - Subtab Updates (Include when providing valuable info):**
- Use **[OTAKON_SUBTAB_UPDATE: {"tab": "tab_name", "content": "content"}]** to save important info to subtabs
- Valid tabs: story_so_far, characters, tips, boss_strategy, quest_log, points_of_interest, hidden_secrets
- Example: Explaining boss mechanics → [OTAKON_SUBTAB_UPDATE: {"tab": "boss_strategy", "content": "**Boss Name**: Attack patterns include..."}]
- Example: Explaining character → [OTAKON_SUBTAB_UPDATE: {"tab": "characters", "content": "**Character Name**: Role in story..."}]

**Suggestions Guidelines:**
Generate 3 short, SPECIFIC follow-up questions based on YOUR response:
- Reference specific elements you identified in the screenshot (boss names, locations, items)
- ❌ BAD: "What should I do next?" (generic)
- ✅ GOOD: "How do I counter [specific boss]'s phase 2 attacks?"
- ✅ GOOD: "What's in the building to the [direction you mentioned]?"

Examples of good suggestions:
- "What's the significance of this location?"
- "How do I handle this type of enemy?"
- "What should I do next here?"
- "Tell me about this character's backstory"
- "What items should I look for in this area?"

**Tag Definitions:**
${ce}
`},xr=(a,e,t,r,s,o,n,i,c)=>{const l=n?Rt(n):"",p=i?`
**User Timezone:** ${i}
When discussing game release dates, provide times in the user's local timezone. For upcoming releases, be specific about exact date and time if known.
`:"",h=c?At(c):"",T=Ct(a,c);let w;s?w=Dt(a,e,t,o):!a.isGameHub&&a.gameTitle?a.isUnreleased?w=Gt(a,e,t,o):w=Pt(a,e,t,r,o):w=It(e);const b=[l,p,h,T].filter(Boolean).join(`
`);return b?b+`

`+w:w};class Mt{constructor(){y(this,"retryAttempts",new Map);y(this,"MAX_RETRIES",3);y(this,"RETRY_DELAYS",[1e3,2e3,4e3])}async handleAIError(e,t){if(console.error(`🤖 [ErrorRecovery] AI Error in ${t.operation}:`,e),this.shouldRetry(t)){const r=this.getRetryDelay(t.retryCount);return await this.delay(r),{type:"retry",action:async()=>{}}}return e.message.includes("API key")||e.message.includes("authentication")?{type:"user_notification",message:"AI service authentication failed. Please check your API key in settings."}:e.message.includes("rate limit")||e.message.includes("quota")?{type:"user_notification",message:"AI service is temporarily busy. Please try again in a few moments."}:e.message.includes("network")||e.message.includes("timeout")?{type:"user_notification",message:"Network connection issue. Please check your internet connection and try again."}:{type:"user_notification",message:"AI service is temporarily unavailable. Please try again later."}}async handleConversationError(e,t){return console.error(`💬 [ErrorRecovery] Conversation Error in ${t.operation}:`,e),e.message.includes("not found")?{type:"fallback",message:"Conversation not found. Creating a new one.",action:async()=>{}}:e.message.includes("permission")||e.message.includes("unauthorized")?{type:"user_notification",message:"Permission denied. Please log in again."}:{type:"user_notification",message:"Failed to save conversation. Your data may not be persisted."}}async handleCacheError(e,t){return console.error(`💾 [ErrorRecovery] Cache Error in ${t.operation}:`,e),{type:"skip",message:"Cache unavailable. Continuing without caching."}}async handleWebSocketError(e,t){if(console.error(`🔌 [ErrorRecovery] WebSocket Error in ${t.operation}:`,e),this.shouldRetry(t)){const r=this.getRetryDelay(t.retryCount);return{type:"retry",action:async()=>{await this.delay(r)}}}return{type:"user_notification",message:"PC connection lost. Screenshot upload may not be available."}}shouldRetry(e){const t=`${e.operation}_${e.conversationId||"global"}`;return(this.retryAttempts.get(t)||0)<this.MAX_RETRIES}getRetryDelay(e){return this.RETRY_DELAYS[Math.min(e,this.RETRY_DELAYS.length-1)]}incrementRetryCount(e){const t=`${e.operation}_${e.conversationId||"global"}`,r=this.retryAttempts.get(t)||0;this.retryAttempts.set(t,r+1)}resetRetryCount(e){const t=`${e.operation}_${e.conversationId||"global"}`;this.retryAttempts.delete(t)}delay(e){return new Promise(t=>setTimeout(t,e))}displayError(e,t="error"){console.log(`[${t.toUpperCase()}] ${e}`),t==="error"&&console.error("User Error:",e)}logError(e,t,r){console.error("Error Details:",{error:e.message,stack:e.stack,context:t,additionalInfo:r,timestamp:new Date().toISOString()})}}const Wr=new Mt;class Ut{constructor(){y(this,"gameTones",{"Action RPG":{adjectives:["epic","heroic","legendary","mystical","ancient"],personality:"wise and experienced adventurer",speechPattern:"speaks with the wisdom of ages and the thrill of adventure",loreStyle:"rich with mythology and ancient secrets"},FPS:{adjectives:["intense","tactical","precise","combat-ready","strategic"],personality:"battle-hardened soldier",speechPattern:"communicates with military precision and combat experience",loreStyle:"focused on warfare, technology, and military history"},Horror:{adjectives:["ominous","chilling","mysterious","haunting","eerie"],personality:"knowledgeable survivor",speechPattern:"speaks with caution and awareness of lurking dangers",loreStyle:"dark and atmospheric, filled with supernatural elements"},Puzzle:{adjectives:["logical","methodical","analytical","clever","systematic"],personality:"brilliant problem-solver",speechPattern:"explains with clear logic and step-by-step reasoning",loreStyle:"intellectual and mysterious, focused on patterns and solutions"},RPG:{adjectives:["immersive","narrative-driven","character-focused","epic","emotional"],personality:"storyteller and guide",speechPattern:"speaks like a narrator, weaving tales and character development",loreStyle:"deep character development and rich storytelling"},Strategy:{adjectives:["tactical","strategic","calculated","methodical","commanding"],personality:"master tactician",speechPattern:"speaks with authority and strategic insight",loreStyle:"focused on warfare, politics, and grand strategy"},Adventure:{adjectives:["exploratory","curious","adventurous","discoverer","wanderer"],personality:"intrepid explorer",speechPattern:"speaks with wonder and excitement about discovery",loreStyle:"filled with exploration, discovery, and world-building"},Default:{adjectives:["helpful","knowledgeable","friendly","supportive","engaging"],personality:"helpful gaming companion",speechPattern:"speaks clearly and helpfully",loreStyle:"focused on gameplay and helpful information"}})}getGameTone(e){return this.gameTones[e]||this.gameTones.Default}generateImmersionContext(e){const t=this.getGameTone(e.genre);let r=`**Immersion Context for ${e.gameTitle}:**
`;return r+=`You are speaking as a ${t.personality} who ${t.speechPattern}.
`,r+=`The game's lore is ${t.loreStyle}.
`,e.currentLocation&&(r+=`The player is currently in: ${e.currentLocation}
`),e.recentEvents&&e.recentEvents.length>0&&(r+=`Recent events: ${e.recentEvents.join(", ")}
`),e.playerProgress!==void 0&&(r+=`Player progress: ${e.playerProgress}%
`),r+=`
**Response Guidelines:**
`,r+=`- Use ${t.adjectives.join(", ")} language
`,r+=`- Maintain the ${t.personality} personality
`,r+=`- Focus on ${t.loreStyle} elements
`,r+=`- Keep responses immersive and in-character
`,r}enhanceResponse(e,t){let r=e;return t.genre==="Horror"?r=`*The shadows seem to whisper as you approach...*

${e}`:t.genre==="Action RPG"?r=`*The ancient knowledge flows through your mind...*

${e}`:t.genre==="FPS"?r=`*Mission briefing updated...*

${e}`:t.genre==="Puzzle"&&(r=`*The solution becomes clearer...*

${e}`),r}getGenreSuggestions(e,t){const r=["Tell me more about this area","What should I do next?","Any tips for this situation?"];return{"Action RPG":["What's the lore behind this location?","How do I improve my character?","What quests are available here?","Tell me about the local NPCs"],FPS:["What's the best tactical approach?","What weapons work best here?","How do I flank the enemy?","What's the mission objective?"],Horror:["What's the history of this place?","How do I survive this area?","What should I be careful of?","Tell me about the local legends"],Puzzle:["What's the pattern here?","How do I solve this step by step?","What clues am I missing?","What's the logical approach?"],RPG:["Tell me about the story so far","What choices should I make?","How do I develop my character?","What's the significance of this moment?"],Strategy:["What's the best strategy here?","How do I manage my resources?","What's the optimal build order?","How do I counter this threat?"]}[e]||r}createImmersiveSubTabContent(e,t,r){var o,n;const s={walkthrough:{"Action RPG":`# ${t} - Walkthrough

*The path of the hero unfolds before you...*

## Current Objective
*Your quest awaits...*

## Next Steps
*The adventure continues...*`,FPS:`# ${t} - Mission Briefing

*Mission parameters updated...*

## Objective
*Target acquired...*

## Tactical Approach
*Weapons ready...*`,Horror:`# ${t} - Survival Guide

*The darkness holds many secrets...*

## Current Situation
*Something stirs in the shadows...*

## Survival Tips
*Stay alert...*`,Default:`# ${t} - Walkthrough

## Current Objective
*Continue your journey...*

## Next Steps
*Progress forward...*`},tips:{"Action RPG":`# ${t} - Wisdom of the Ages

*Ancient knowledge flows through these tips...*

## Combat Mastery
*Master the blade and magic...*

## Exploration Secrets
*Hidden treasures await...*`,FPS:`# ${t} - Tactical Intelligence

*Mission-critical information...*

## Weapon Mastery
*Know your arsenal...*

## Tactical Positioning
*Control the battlefield...*`,Horror:`# ${t} - Survival Knowledge

*The darkness teaches harsh lessons...*

## Survival Tactics
*Stay alive...*

## Environmental Awareness
*Trust your instincts...*`,Default:`# ${t} - Tips & Tricks

## General Tips
*Improve your gameplay...*

## Advanced Techniques
*Master the game...*`}};return((o=s[e])==null?void 0:o[r])||((n=s[e])==null?void 0:n.Default)||`# ${t} - ${e}

*Content loading...*`}}const $r=new Ut,Lt=`You are a correction validator for OTAKON, an AI gaming companion.
Your job is to validate user-submitted corrections to ensure they:

1. DON'T BREAK CHARACTER: OTAKON is enthusiastic, knowledgeable, and uses gamer lingo. Corrections should maintain this personality.
2. ARE FACTUALLY REASONABLE: For gaming facts, the correction should be plausible (you don't need to verify, just check it's not obviously wrong).
3. ARE NOT HARMFUL: No offensive, discriminatory, or inappropriate content.
4. ARE CONTEXTUALLY RELEVANT: The correction should make sense in a gaming context.
5. ARE CONSTRUCTIVE: The correction should improve future responses.

Respond in JSON format:
{
  "isValid": boolean,
  "reason": "Brief explanation of your decision",
  "suggestedType": "factual" | "style" | "terminology" | "behavior" | null
}`,Ft=(a,e,t)=>`
Validate this correction:

ORIGINAL AI RESPONSE (snippet):
"${a.slice(0,500)}"

USER'S CORRECTION:
"${e}"

GAME CONTEXT: ${t||"General gaming / Game Hub"}

Is this correction valid? Respond with JSON only.`,pe="otakon_correction_submissions",V=3;function xe(){try{const a=localStorage.getItem(pe),e=Date.now();if(!a)return{allowed:!0,remaining:V};const t=JSON.parse(a);if(e>t.resetAt)return{allowed:!0,remaining:V};const r=V-t.count;return{allowed:r>0,remaining:Math.max(0,r)}}catch{return{allowed:!0,remaining:V}}}function xt(){try{const a=localStorage.getItem(pe),e=Date.now(),t=1440*60*1e3;let r={count:0,resetAt:e+t};a&&(r=JSON.parse(a),e>r.resetAt&&(r={count:0,resetAt:e+t})),r.count++,localStorage.setItem(pe,JSON.stringify(r))}catch{}}async function We(a,e,t){if(!e.trim())return{isValid:!1,reason:"Correction text is empty"};if(e.length<5)return{isValid:!1,reason:"Correction is too short"};if(e.length>1e3)return{isValid:!1,reason:"Correction is too long (max 1000 characters)"};const r=[/\b(hate|kill|die|attack)\s+(all|every|those)\b/i,/\b(racial|ethnic)\s+slur/i,/\bviolence\s+against\b/i];for(const s of r)if(s.test(e))return{isValid:!1,reason:"Correction contains inappropriate content"};try{const{data:s,error:o}=await u.functions.invoke("gemini-chat",{body:{messages:[{role:"system",content:Lt},{role:"user",content:Ft(a,e,t)}],model:"gemini-2.0-flash",temperature:.1,maxTokens:200}});if(o)return console.error("[CorrectionService] Validation API error:",o),{isValid:!1,reason:"Validation service temporarily unavailable. Please try again later."};const n=(s==null?void 0:s.content)||(s==null?void 0:s.response)||"",i=n.match(/\{[\s\S]*\}/);if(i){const c=JSON.parse(i[0]);return{isValid:c.isValid===!0,reason:c.reason||"Validation complete",suggestedType:c.suggestedType||void 0}}return console.warn("[CorrectionService] Could not parse validation response:",n),{isValid:!1,reason:"Validation response was unclear. Please try again."}}catch(s){return console.error("[CorrectionService] Validation exception:",s),{isValid:!1,reason:"Validation failed. Please try again later."}}}async function Wt(a,e){if(!xe().allowed)return{success:!1,error:`Daily correction limit reached (${V}/day). Try again tomorrow.`};const r=await We(e.originalResponse,e.correctionText,e.gameTitle),{error:s}=await u.from("ai_feedback").insert({user_id:a,conversation_id:e.conversationId,message_id:e.messageId,feedback_type:"down",content_type:"message",category:"correction",comment:e.originalResponse.slice(0,500),correction_text:e.correctionText,correction_type:e.type,correction_scope:e.scope,is_validated:r.isValid,validation_reason:r.reason,game_title:e.gameTitle});if(s)return console.error("[CorrectionService] Failed to store feedback:",s),{success:!1,error:"Failed to save correction"};if(!r.isValid)return{success:!1,error:r.reason};const o=await A.addCorrection(a,{gameTitle:e.gameTitle,originalSnippet:e.originalResponse.slice(0,200),correctionText:e.correctionText,type:r.suggestedType||e.type,scope:e.scope});return o.success?(xt(),{success:!0,correction:(await A.getActiveCorrections(a,e.gameTitle)).find(c=>c.correctionText===e.correctionText)}):{success:!1,error:o.error}}const $t=[/\b(boss(?:es)?|mini-boss|final boss)\b/gi,/\b(enemy types?|elite enemies|common enemies)\b/gi,/\b(legendary weapon|rare item|unique gear)\b/gi,/\b(skill tree|ability points?|talent build)\b/gi,/\b(main quest|side quest|daily quest)\b/gi,/\b(damage build|tank build|support build|dps build)\b/gi,/\b(speedrun(?:ning)?|world record|personal best)\b/gi,/\b(secret area|hidden path|easter egg)\b/gi,/\b(tier list|meta build|optimal strategy)\b/gi,/\b(patch notes?|balance changes?|nerf(?:ed)?|buff(?:ed)?)\b/gi,/\b(dlc|expansion pack|season pass)\b/gi,/\b(game mechanics?|combat system|progression system)\b/gi,/\b(character build|loadout guide|equipment guide)\b/gi],Bt=/\b([A-Z][a-z]{2,}(?:\s+(?:of|the|and)\s+)?[A-Z][a-z]{2,}(?:\s+[A-Z][a-z]+)?)\b/g;function Kt(a){if(!a||a.length<100)return[];const e=new Set;for(const n of $t){const i=a.match(n);if(i)for(const c of i){const l=c.toLowerCase().trim();l.length>=6&&l.length<=50&&l.includes(" ")&&e.add(l)}}let t=0;const r=a.match(Bt);if(r)for(const n of r){if(t>=5)break;const i=n.toLowerCase().trim();i.length>=6&&i.length<=40&&(e.add(i),t++)}const s=/\b(chapter|level|stage|floor|wave|round|phase|part|episode|act)\s+(\d+)\b/gi;let o;for(;(o=s.exec(a))!==null;)e.add(`${o[1].toLowerCase()} ${o[2]}`);return Array.from(e).slice(0,10)}async function Ht(a){return(await A.getBehaviorData(a)).aiCorrections}async function Yt(a,e){return A.getActiveCorrections(a,e,!0)}function Vt(){return xe()}const G={validateCorrection:We,submitCorrection:Wt,getAllCorrections:Ht,getContextualCorrections:Yt,getRateLimitStatus:Vt,extractTopicsFromResponse:Kt,toggleCorrection:A.toggleCorrection,removeCorrection:A.removeCorrection},le={free:8,pro:30,vanguard_pro:100},fe=new Set(["fortnite","apex legends","warzone","call of duty warzone","pubg","playerunknown's battlegrounds","league of legends","lol","dota 2","dota","smite","heroes of the storm","overwatch","overwatch 2","valorant","rainbow six siege","r6","paladins","world of warcraft","wow","final fantasy xiv","ffxiv","ff14","guild wars 2","gw2","elder scrolls online","eso","destiny 2","destiny","warframe","lost ark","new world","diablo 4","diablo iv","path of exile","poe","genshin impact","honkai star rail","zenless zone zero","zzz","wuthering waves","tower of fantasy","fifa","ea fc","fc 24","fc 25","madden","nba 2k","2k24","2k25","hearthstone","marvel snap","legends of runeterra","lor","magic arena","mtg arena","street fighter 6","sf6","tekken 8","mortal kombat 1","mk1","guilty gear strive","the finals","xdefiant","helldivers 2","sea of thieves","no man's sky","fall guys","rocket league","dead by daylight","dbd"]),ye=new Set(["gta 6","grand theft auto 6","grand theft auto vi","monster hunter wilds","death stranding 2","death stranding 2: on the beach","ghost of yotei","like a dragon: pirate yakuza in hawaii","kingdom come deliverance 2","kingdom come 2","avowed","civilization 7","civ 7","civilization vii","fable","assassin's creed shadows","split fiction","doom: the dark ages","borderlands 4","mafia: the old country","marvel 1943","judge 0"]),$e=new Date("2025-01-31T23:59:59Z").getTime();function Be(a){return a?a*1e3>$e:!1}function Se(a){if(!a)return!1;const e=a.toLowerCase().trim();return fe.has(e)||Array.from(fe).some(t=>e.includes(t))}function be(a){if(!a)return!1;const e=a.toLowerCase().trim();return ye.has(e)||Array.from(ye).some(t=>e.includes(t))}function Ke(a,e,t){const r=a.toLowerCase();if(Be(t))return console.log("🔍 [GroundingControl] Game detected as post-cutoff via IGDB release date"),"post_cutoff_game";if(be(e)||be(a))return"post_cutoff_game";const s=Se(e)||Se(a);return s&&(r.includes("meta")||r.includes("tier list")||r.includes("best")||r.includes("current")||r.includes("viable")||r.includes("nerf")||r.includes("buff")||r.includes("season")||r.includes("ranked")||r.includes("competitive")||r.includes("patch"))?"live_service_meta":r.includes("latest news")||r.includes("recent news")||r.includes("gaming news")||r.includes("announced today")||r.includes("announced this week")||r.includes("just announced")||r.includes("breaking news")||r.includes("new announcement")?"current_news":r.includes("patch notes")||r.includes("latest patch")||r.includes("recent update")||r.includes("new update")||r.includes("hotfix")||r.includes("balance change")||r.includes("what changed")||r.includes("patch")&&(r.includes("today")||r.includes("latest")||r.includes("new"))?"patch_notes":r.includes("release")&&r.includes("date")||r.includes("when does")||r.includes("when is")||r.includes("coming out")||r.includes("launch date")||r.includes("coming soon")||r.includes("2025")||r.includes("2026")?"release_dates":!s&&(r.includes("how do i")||r.includes("how to")||r.includes("help me")||r.includes("stuck on")||r.includes("boss")||r.includes("strategy")||r.includes("build")||r.includes("tips")||r.includes("guide")||r.includes("walkthrough")||r.includes("where is")||r.includes("where can i")||r.includes("best way to")||r.includes("how do you")||r.includes("explain"))?"game_help":"general_knowledge"}function He(a,e,t){const r=le[e];return t>=r?{useGrounding:!1,reason:`Monthly grounding limit reached (${t}/${r}). AI will use training knowledge.`}:a==="post_cutoff_game"?{useGrounding:!0,reason:"Game released after AI knowledge cutoff (Jan 2025) - web search required"}:a==="live_service_meta"?e==="free"&&t>=4?{useGrounding:!1,reason:"Free tier live service meta limited - upgrade for more current data"}:{useGrounding:!0,reason:"Live service game - current meta/patch info requires web search"}:a==="current_news"?{useGrounding:!0,reason:"Current news query requires web search"}:a==="patch_notes"?{useGrounding:!0,reason:"Recent patch notes require web search"}:a==="release_dates"?{useGrounding:!0,reason:"Release date verification via web search"}:a==="game_help"?{useGrounding:!1,reason:"Known game - AI has comprehensive training knowledge"}:a==="general_knowledge"?{useGrounding:!1,reason:"General gaming knowledge - AI can answer from training"}:{useGrounding:!1,reason:"Default: use AI knowledge"}}const q=new Map,zt=300*1e3;let $=null;function Ye(){const a=new Date;return`${a.getFullYear()}-${String(a.getMonth()+1).padStart(2,"0")}`}async function _e(a){var r;const e=Ye(),t=q.get(a);if(t&&t.month===e&&Date.now()-t.lastSync<zt)return t.count;if($===!1)return(t==null?void 0:t.count)||0;try{const{data:s,error:o}=await u.from("user_grounding_usage").select("usage_count").eq("auth_user_id",a).eq("month_year",e).single();if(o){if(o.code==="42P01"||(r=o.message)!=null&&r.includes("does not exist"))return console.warn("[GroundingControl] DB table not yet created, using in-memory tracking"),$=!1,(t==null?void 0:t.count)||0;if(o.code!=="PGRST116")return console.error("[GroundingControl] Failed to fetch usage:",o),(t==null?void 0:t.count)||0}$=!0;const n=(s==null?void 0:s.usage_count)||0;return q.set(a,{count:n,month:e,lastSync:Date.now()}),n}catch(s){return console.error("[GroundingControl] Error fetching usage:",s),(t==null?void 0:t.count)||0}}async function qt(a){var r,s;const e=Ye(),t=q.get(a);if(t&&t.month===e?(t.count++,t.lastSync=Date.now()):q.set(a,{count:1,month:e,lastSync:Date.now()}),$===!1){console.log(`🔍 [GroundingControl] Incremented usage (in-memory) for ${a} (month: ${e})`);return}try{const{error:o}=await u.from("user_grounding_usage").upsert({auth_user_id:a,month_year:e,usage_count:((r=q.get(a))==null?void 0:r.count)||1,updated_at:new Date().toISOString()},{onConflict:"auth_user_id,month_year"});if(o){if(o.code==="42P01"||(s=o.message)!=null&&s.includes("does not exist")){console.warn("[GroundingControl] DB table not yet created, using in-memory tracking"),$=!1;return}await u.rpc("increment_grounding_usage",{p_auth_user_id:a,p_month_year:e})}$=!0,console.log(`🔍 [GroundingControl] Incremented usage for ${a} (month: ${e})`)}catch(o){console.error("[GroundingControl] Failed to increment usage:",o)}}async function jt(a,e){const t=await _e(a),r=le[e];return Math.max(0,r-t)}async function Jt(a,e,t,r,s){const o=Ke(t,r,s),n=await _e(a),i=le[e],c=Math.max(0,i-n),{useGrounding:l,reason:p}=He(o,e,n);return console.log("🔍 [GroundingControl] Check result:",{tier:e,queryType:o,useGrounding:l,reason:p,usage:`${n}/${i}`,remainingQuota:c,igdbReleaseDate:s?new Date(s*1e3).toISOString():"N/A"}),{useGrounding:l,queryType:o,reason:p,remainingQuota:c}}const Br={classifyQuery:Ke,shouldUseGrounding:He,getGroundingUsage:_e,incrementGroundingUsage:qt,getRemainingQuota:jt,checkGroundingEligibility:Jt,isLiveServiceGame:Se,isPostCutoffGame:be,isRecentRelease:Be,GROUNDING_LIMITS:le,LIVE_SERVICE_GAMES:fe,POST_CUTOFF_GAMES:ye,KNOWLEDGE_CUTOFF_TIMESTAMP:$e};class Xt{constructor(){y(this,"STORAGE_KEY","otakon_used_suggested_prompts");y(this,"LAST_RESET_KEY","otakon_suggested_prompts_last_reset");y(this,"RESET_INTERVAL_MS",1440*60*1e3);y(this,"usedPrompts",new Set);this.loadUsedPrompts(),this.checkAndResetIfNeeded()}loadUsedPrompts(){try{const e=localStorage.getItem(this.STORAGE_KEY);if(e){const t=JSON.parse(e);this.usedPrompts=new Set(t)}}catch{this.usedPrompts=new Set}}saveUsedPrompts(){try{const e=Array.from(this.usedPrompts);localStorage.setItem(this.STORAGE_KEY,JSON.stringify(e))}catch{}}checkAndResetIfNeeded(){try{const e=localStorage.getItem(this.LAST_RESET_KEY),t=Date.now();(!e||t-parseInt(e)>=this.RESET_INTERVAL_MS)&&(this.resetUsedPrompts(),localStorage.setItem(this.LAST_RESET_KEY,t.toString()))}catch{}}markPromptAsUsed(e){this.usedPrompts.add(e),this.saveUsedPrompts()}isPromptUsed(e){return this.usedPrompts.has(e)}getUnusedPrompts(e){return e.filter(t=>!this.isPromptUsed(t))}areAllPromptsUsed(e){return e.every(t=>this.isPromptUsed(t))}resetUsedPrompts(){this.usedPrompts.clear(),localStorage.removeItem(this.STORAGE_KEY)}getUsedCount(){return this.usedPrompts.size}getTimeUntilNextReset(){try{const e=localStorage.getItem(this.LAST_RESET_KEY);if(!e)return 0;const t=parseInt(e)+this.RESET_INTERVAL_MS;return Math.max(0,t-Date.now())}catch{return 0}}getStaticNewsPrompts(){return st}processAISuggestions(e){if(!e)return[];let t=[];if(Array.isArray(e))t=e;else if(typeof e=="string"){let s=e.trim();s.startsWith('["')&&!s.endsWith('"]')&&(s.endsWith('"')||(s+='"'),s.endsWith("]")||(s+="]"));try{const o=JSON.parse(s);Array.isArray(o)?t=o:t=[e]}catch{s.includes('", "')||s.includes(`",
"`)?t=s.split(/",\s*"/).map(n=>n.replace(/^["\s]+|["\s]+$/g,"")).filter(n=>n.length>0):s.includes(`
`)?t=s.split(`
`).map(n=>n.replace(/^["\s]+|["\s]+$/g,"")).filter(n=>n.length>0):t=[e]}}return t.filter(s=>s&&typeof s=="string"&&s.trim().length>0).map(s=>s.trim()).slice(0,3)}getFallbackSuggestions(e,t){return t===!0||e==="game-hub"||e==="everything-else"?this.getStaticNewsPrompts():["What should I do next in this area?","Tell me about the story so far","Give me some tips for this game","What are the key mechanics I should know?"]}}const Kr=new Xt,J=new Map,Qt=300*1e3;function Zt(a,e,t){return`${a}:${e}:${t||"global"}`}function er(a){const e=J.get(a);return e?Date.now()-e.timestamp>Qt?(J.delete(a),null):e.prompts:null}function tr(a,e){J.set(a,{prompts:e,timestamp:Date.now()})}function Ve(a){for(const e of J.keys())e.startsWith(a)&&J.delete(e)}async function Oe(a,e,t=null,r=20){const s=Zt(a,e,t),o=er(s);if(o)return o;try{const n=new Date;n.setDate(n.getDate()-7);let i=u.from("ai_shown_prompts").select("prompt_text").eq("auth_user_id",a).eq("prompt_type",e).gte("shown_at",n.toISOString()).order("shown_at",{ascending:!1}).limit(r);t&&(i=i.or(`game_title.eq.${t},game_title.is.null`));const{data:c,error:l}=await i;if(l)return console.error("[ShownPromptsService] Error fetching prompts:",l),[];const p=(c||[]).map(h=>h.prompt_text);return tr(s,p),p}catch(n){return console.error("[ShownPromptsService] Exception fetching prompts:",n),[]}}async function rr(a,e){try{const{error:t}=await u.from("ai_shown_prompts").insert({auth_user_id:a,prompt_text:e.promptText,prompt_type:e.promptType,game_title:e.gameTitle||null,conversation_id:e.conversationId||null});return t?(console.error("[ShownPromptsService] Error recording prompt:",t),!1):(Ve(a),!0)}catch(t){return console.error("[ShownPromptsService] Exception recording prompt:",t),!1}}async function sr(a,e){if(!e.length)return!0;try{const t=e.map(s=>({auth_user_id:a,prompt_text:s.promptText,prompt_type:s.promptType,game_title:s.gameTitle||null,conversation_id:s.conversationId||null})),{error:r}=await u.from("ai_shown_prompts").insert(t);return r?(console.error("[ShownPromptsService] Error batch recording prompts:",r),!1):(Ve(a),!0)}catch(t){return console.error("[ShownPromptsService] Exception batch recording prompts:",t),!1}}async function ar(a,e){try{const{error:t}=await u.from("ai_shown_prompts").update({clicked:!0,clicked_at:new Date().toISOString()}).eq("auth_user_id",a).eq("prompt_text",e).is("clicked",!1);return t?(console.error("[ShownPromptsService] Error marking prompt clicked:",t),!1):!0}catch(t){return console.error("[ShownPromptsService] Exception marking prompt clicked:",t),!1}}async function or(a,e,t,r=null){if(!e.length)return[];const s=await Oe(a,t,r),o=new Set(s.map(n=>n.toLowerCase().trim()));return e.filter(n=>!o.has(n.toLowerCase().trim()))}async function nr(a,e,t,r=null){const s=await Oe(a,t,r),o=e.toLowerCase().trim();return s.some(n=>n.toLowerCase().trim()===o)}const Hr={getRecentShownPrompts:Oe,recordShownPrompt:rr,recordShownPrompts:sr,markPromptClicked:ar,filterNewPrompts:or,hasPromptBeenShown:nr},F=class F{static getInstance(){return F.instance||(F.instance=new F),F.instance}async getSubtabs(e){return this.getSubtabsFromTable(e)}async setSubtabs(e,t){console.error(`🔄 [SubtabsService] Writing ${t.length} subtabs to normalized table for conversation:`,e);const r=await this.setSubtabsInTable(e,t);return console.error("  ✅ Table write:",r?"SUCCESS":"FAILED"),r}async addSubtab(e,t){const{data:r,error:s}=await u.from("conversations").select("is_unreleased, title").eq("id",e).single();if(s)return console.error("Error checking conversation for unreleased status:",s),null;if(r!=null&&r.is_unreleased)throw new Error("Subtabs cannot be created for unreleased games. This feature will be available once the game is released.");return await this.addSubtabToTable(e,t)}async updateSubtab(e,t,r){return await this.updateSubtabInTable(t,r)}async deleteSubtab(e,t){return this.deleteSubtabFromTable(t)}async getSubtabsFromTable(e){try{const{data:t,error:r}=await u.from("subtabs").select("*").eq("conversation_id",e).order("order_index",{ascending:!0});return r?(console.error("Error getting subtabs from table:",r),[]):(t||[]).map(s=>{const o=typeof s.metadata=="object"&&s.metadata!==null?s.metadata:{};return{id:s.id,conversationId:s.conversation_id??void 0,title:s.title,content:s.content||"",type:s.tab_type,isNew:o.isNew||!1,status:o.status||"loaded",instruction:o.instruction}})}catch(t){return console.error("Error getting subtabs from table:",t),[]}}async setSubtabsInTable(e,t){try{const{data:r,error:s}=await u.from("conversations").select("*").eq("id",e).single(),o=r==null?void 0:r.auth_user_id;if(s||!o)return console.error("❌ [SubtabsService] Error getting conversation auth_user_id:",s),console.error("❌ [SubtabsService] Conversation may not exist yet. ConversationId:",e),!1;console.error(`🔄 [SubtabsService] Using auth_user_id: ${o} for ${t.length} subtabs`);const{error:n}=await u.from("subtabs").delete().eq("conversation_id",e);if(n)return console.error("Error deleting existing subtabs:",n),!1;if(t.length>0){const i=t.map((l,p)=>(l.type||console.error(`⚠️ [SubtabsService] Subtab "${l.title}" has NULL type! Using fallback.`),{id:l.id,conversation_id:e,game_id:null,title:l.title||"Untitled",content:l.content||"",tab_type:l.type||"chat",order_index:p,auth_user_id:o,metadata:{isNew:l.isNew,status:l.status,instruction:l.instruction}}));console.error("🔄 [SubtabsService] Inserting subtabs:",i.map(l=>({title:l.title,tab_type:l.tab_type,has_auth_user_id:!!l.auth_user_id})));const{error:c}=await u.from("subtabs").insert(i);if(c)return console.error("❌ [SubtabsService] Error inserting subtabs:",c),console.error("❌ [SubtabsService] Failed subtabs data:",JSON.stringify(i,null,2)),!1;console.error("✅ [SubtabsService] Successfully inserted",t.length,"subtabs")}return!0}catch(r){return console.error("❌ [SubtabsService] Error setting subtabs in table:",r),!1}}async addSubtabToTable(e,t){var r;try{const{data:s}=await u.from("conversations").select("game_id").eq("id",e).single(),o=(s==null?void 0:s.game_id)||"",{data:n}=await u.from("subtabs").select("order_index").eq("conversation_id",e).order("order_index",{ascending:!1}).limit(1),i=((r=n==null?void 0:n[0])==null?void 0:r.order_index)??-1,{data:c,error:l}=await u.from("subtabs").insert({id:t.id,conversation_id:e,game_id:o,title:t.title,content:t.content,tab_type:t.type,order_index:i+1,metadata:{isNew:t.isNew,status:t.status,instruction:t.instruction}}).select().single();return l?(console.error("Error adding subtab to table:",l),null):{id:c.id,conversationId:c.conversation_id??void 0,title:c.title,content:at(c.content),type:c.tab_type,isNew:typeof c.metadata=="object"&&c.metadata!==null&&!Array.isArray(c.metadata)&&c.metadata.isNew||!1,status:(typeof c.metadata=="object"&&c.metadata!==null&&!Array.isArray(c.metadata)?c.metadata.status:void 0)||"loaded",instruction:typeof c.metadata=="object"&&c.metadata!==null&&!Array.isArray(c.metadata)?c.metadata.instruction:void 0}}catch(s){return console.error("Error adding subtab to table:",s),null}}async updateSubtabInTable(e,t){try{const r={};if(t.title!==void 0&&(r.title=t.title),t.content!==void 0&&(r.content=t.content),t.type!==void 0&&(r.tab_type=t.type),t.isNew!==void 0||t.status!==void 0||t.instruction!==void 0){const{data:o}=await u.from("subtabs").select("metadata").eq("id",e).single(),n=typeof(o==null?void 0:o.metadata)=="object"&&(o==null?void 0:o.metadata)!==null?o.metadata:{};r.metadata={...n,...t.isNew!==void 0&&{isNew:t.isNew},...t.status!==void 0&&{status:t.status},...t.instruction!==void 0&&{instruction:t.instruction}}}const{error:s}=await u.from("subtabs").update(r).eq("id",e);return s?(console.error("Error updating subtab in table:",s),!1):!0}catch(r){return console.error("Error updating subtab in table:",r),!1}}async deleteSubtabFromTable(e){try{const{error:t}=await u.from("subtabs").delete().eq("id",e);return t?(console.error("Error deleting subtab from table:",t),!1):!0}catch(t){return console.error("Error deleting subtab from table:",t),!1}}async getSubtabsFromJsonb(e){try{const{data:t,error:r}=await u.from("conversations").select("subtabs").eq("id",e).single();return r?(console.error("Error getting subtabs from JSONB:",r),[]):(t==null?void 0:t.subtabs)||[]}catch(t){return console.error("Error getting subtabs from JSONB:",t),[]}}async setSubtabsInJsonb(e,t){try{const{error:r}=await u.from("conversations").update({subtabs:t,subtabs_order:t.map(s=>s.id)}).eq("id",e);return r?(console.error("Error setting subtabs in JSONB:",r),!1):!0}catch(r){return console.error("Error setting subtabs in JSONB:",r),!1}}async migrateConversationSubtabs(e){try{const t=await this.getSubtabsFromJsonb(e);return t.length===0?!0:await this.setSubtabsInTable(e,t)}catch(t){return console.error("Error migrating subtabs:",t),!1}}async rollbackConversationSubtabs(e){try{const t=await this.getSubtabsFromTable(e);return t.length===0?!0:await this.setSubtabsInJsonb(e,t)}catch(t){return console.error("Error rolling back subtabs:",t),!1}}async migrateAllSubtabs(){try{const{data:e,error:t}=await u.from("conversations").select("id, subtabs").not("subtabs","is",null);if(t)return console.error("Error fetching conversations:",t),{success:0,failed:0};let r=0,s=0;const o=(e||[]).filter(i=>i.subtabs&&Array.isArray(i.subtabs)&&i.subtabs.length>0).map(i=>this.migrateConversationSubtabs(i.id));return(await Promise.allSettled(o)).forEach(i=>{i.status==="fulfilled"&&i.value?r++:s++}),{success:r,failed:s}}catch(e){return console.error("Error in batch migration:",e),{success:0,failed:0}}}};y(F,"instance");let Ee=F;const Yr=Ee.getInstance(),D=a=>a;class Vr{static getCurrentUser(){return P.get(k.USER,null)}static setCurrentUser(e){P.set(k.USER,e)}static createUser(e,t=ot.FREE){const r=Date.now(),s=Ae[t];return{id:`user_${r}`,authUserId:`user_${r}`,email:e,tier:t,hasProfileSetup:!1,hasSeenSplashScreens:!1,hasSeenHowToUse:!1,hasSeenFeaturesConnected:!1,hasSeenProFeatures:!1,pcConnected:!1,pcConnectionSkipped:!1,onboardingCompleted:!1,hasWelcomeMessage:!1,isNewUser:!0,hasUsedTrial:!1,lastActivity:r,preferences:{},textCount:0,imageCount:0,textLimit:s.text,imageLimit:s.image,totalRequests:0,lastReset:r,usage:{textCount:0,imageCount:0,textLimit:s.text,imageLimit:s.image,totalRequests:0,lastReset:r,tier:t},appState:{},profileData:{},onboardingData:{},behaviorData:{},feedbackData:{},usageData:{},createdAt:r,updatedAt:r}}static updateUser(e){const t=this.getCurrentUser();if(!t)return;const r={...t,...e,updatedAt:Date.now()};this.setCurrentUser(r)}static updateUsage(e){const t=this.getCurrentUser();t&&this.updateUser({usage:{...t.usage,...e}})}static resetUsage(){const e=this.getCurrentUser();if(!e)return;const t=Ae[e.tier];this.updateUsage({textCount:0,imageCount:0,totalRequests:0,lastReset:Date.now(),textLimit:t.text,imageLimit:t.image})}static canMakeRequest(e){const t=this.getCurrentUser();if(!t)return!1;const{usage:r}=t;return e==="text"?r.textCount<r.textLimit:r.imageCount<r.imageLimit}static incrementUsage(e){const t=this.getCurrentUser();if(!t)return;const r={totalRequests:t.usage.totalRequests+1};e==="text"?r.textCount=t.usage.textCount+1:r.imageCount=t.usage.imageCount+1,this.updateUsage(r)}static logout(){P.remove(k.USER)}static async getCurrentUserAsync(){try{const e=P.get(k.USER,null),{data:{user:t},error:r}=await u.auth.getUser();if(r||!t)return e;const{data:s,error:o}=await u.from("users").select("*").eq("auth_user_id",t.id).single();if(o||!s)return console.error("Failed to fetch user from Supabase:",o),e;const n={id:s.id,authUserId:s.auth_user_id,email:s.email,tier:s.tier,textCount:s.text_count||0,imageCount:s.image_count||0,textLimit:Z(s.text_limit),imageLimit:Z(s.image_limit),totalRequests:s.total_requests||0,lastReset:H(s.last_reset),hasProfileSetup:s.has_profile_setup||!1,hasSeenSplashScreens:s.has_seen_splash_screens||!1,hasSeenHowToUse:s.has_seen_how_to_use||!1,hasSeenFeaturesConnected:s.has_seen_features_connected||!1,hasSeenProFeatures:s.has_seen_pro_features||!1,pcConnected:s.pc_connected||!1,pcConnectionSkipped:s.pc_connection_skipped||!1,onboardingCompleted:s.onboarding_completed||!1,hasWelcomeMessage:s.has_welcome_message||!1,isNewUser:s.is_new_user||!1,hasUsedTrial:s.has_used_trial||!1,lastActivity:H(s.updated_at),preferences:I(s.preferences),usage:{textCount:s.text_count||0,imageCount:s.image_count||0,textLimit:Z(s.text_limit),imageLimit:Z(s.image_limit),totalRequests:s.total_requests||0,lastReset:H(s.last_reset),tier:s.tier},appState:I(s.app_state),profileData:I(s.profile_data),onboardingData:I(s.onboarding_data),behaviorData:I(s.behavior_data),feedbackData:I(s.feedback_data),usageData:I(s.usage_data),createdAt:H(s.created_at),updatedAt:H(s.updated_at)};return P.set(k.USER,n),n}catch(e){return console.error("Error in getCurrentUserAsync:",e),P.get(k.USER,null)}}static async setCurrentUserAsync(e){try{P.set(k.USER,e);const{error:t}=await u.from("users").update({tier:e.tier,text_count:e.textCount,image_count:e.imageCount,text_limit:e.textLimit,image_limit:e.imageLimit,total_requests:e.totalRequests,last_reset:new Date(e.lastReset).toISOString(),has_profile_setup:e.hasProfileSetup,has_seen_splash_screens:e.hasSeenSplashScreens,has_seen_how_to_use:e.hasSeenHowToUse,has_seen_features_connected:e.hasSeenFeaturesConnected,has_seen_pro_features:e.hasSeenProFeatures,pc_connected:e.pcConnected,pc_connection_skipped:e.pcConnectionSkipped,onboarding_completed:e.onboardingCompleted,has_welcome_message:e.hasWelcomeMessage,has_used_trial:e.hasUsedTrial,preferences:D(e.preferences),profile_data:D(e.profileData),app_state:D(e.appState),onboarding_data:D(e.onboardingData),behavior_data:D(e.behaviorData),feedback_data:D(e.feedbackData),usage_data:D(e.usageData),updated_at:new Date().toISOString()}).eq("auth_user_id",e.authUserId);t&&console.error("Failed to sync user to Supabase:",t)}catch(t){console.error("Error in setCurrentUserAsync:",t)}}static async updateUsageAsync(e){const t=await this.getCurrentUserAsync();if(!t)return;const r={...t,usage:{...t.usage,...e},textCount:e.textCount??t.textCount,imageCount:e.imageCount??t.imageCount,totalRequests:e.totalRequests??t.totalRequests,lastReset:e.lastReset??t.lastReset,updatedAt:Date.now()};await this.setCurrentUserAsync(r)}}class ir{hasTabCommand(e){return/^@\w+/.test(e.trim())}parseTabCommand(e,t){const r=e.trim();if(!this.hasTabCommand(r))return null;const s=r.match(/^@(\w+)\s*(\\modify|\\delete)?\s*(.*)$/);if(!s)return null;const[,o,n,i]=s,c=this.findMatchingTab(o,t.subtabs||[]);if(!c)return null;let l;return n==="\\delete"?l="delete":n==="\\modify"?l="modify":l="update",{type:l,tabId:c.id,tabName:c.title,instruction:i.trim()}}findMatchingTab(e,t){const r=this.normalizeTabName(e);let s=t.find(o=>this.normalizeTabName(o.id)===r||this.normalizeTabName(o.title)===r);return s||(s=t.find(o=>this.normalizeTabName(o.id).includes(r)||this.normalizeTabName(o.title).includes(r)),s)?s:(s=t.find(o=>r.includes(this.normalizeTabName(o.id))||r.includes(this.normalizeTabName(o.title))),s||null)}normalizeTabName(e){return e.toLowerCase().replace(/[_\s-]+/g,"").replace(/[^a-z0-9]/g,"")}getAvailableTabNames(e){return!e.subtabs||e.subtabs.length===0?[]:e.subtabs.map(t=>({id:t.id,title:t.title}))}formatTabSuggestion(e,t){return`@${e}`}getCommandHelp(){return`
**Tab Commands:**
• @<tab> <text> - Update tab with new info
• @<tab> \\modify <text> - Modify/rename tab
• @<tab> \\delete - Delete tab

Example: @story_so_far The player defeated the first boss
    `.trim()}validateCommand(e){switch(e.type){case"update":if(!e.instruction)return{valid:!1,error:"Update command requires content. Example: @story_so_far The player..."};break;case"modify":if(!e.instruction)return{valid:!1,error:"Modify command requires instructions. Example: @tips \\modify Change to combat strategies"};break}return{valid:!0}}describeCommand(e){switch(e.type){case"update":return`Updating "${e.tabName}" with: ${e.instruction}`;case"modify":return`Modifying "${e.tabName}": ${e.instruction}`;case"delete":return`Deleting "${e.tabName}"`}}}const zr=new ir;let g,W=[],Ge=!1,X="",j=null,R=null,_=null,we=!1,N=null;const cr="otakonSpeechRate",ve=async()=>{try{const a=navigator;a.wakeLock&&(j=await a.wakeLock.request("screen"),console.log("🔒 [TTS] Wake lock acquired - screen will stay on"),j.addEventListener("release",()=>{console.log("🔓 [TTS] Wake lock released"),g&&g.speaking&&!we&&ve()}))}catch(a){console.warn("⚠️ [TTS] Wake lock not available:",a)}},ze=async()=>{try{j!==null&&(await j.release(),j=null)}catch{}},lr=()=>{try{if(!R){const a=window,e=a.AudioContext||a.webkitAudioContext;e&&(R=new e,console.log("🔊 [TTS] Audio context initialized"))}_||(_=new Audio,_.src="data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACBhYqFbF1fdJivrJBhNjVgodDbq2EcBj+a2teleShtr9teleShtr9teleShtr9teleShtr9t",_.loop=!0,_.volume=.01,_.load(),console.log("🔇 [TTS] Silent audio initialized for background playback"))}catch(a){console.warn("⚠️ [TTS] Audio context init failed:",a)}},qe=async()=>{try{R&&R.state==="suspended"&&(await R.resume(),console.log("🔊 [TTS] Audio context resumed")),_&&(_.currentTime=0,await _.play(),console.log("🔇 [TTS] Silent audio playing for background session")),N||(N=setInterval(()=>{g&&g.speaking?R&&R.state==="suspended"&&R.resume().catch(()=>{}):N&&(clearInterval(N),N=null)},5e3))}catch(a){console.warn("⚠️ [TTS] Silent audio start failed:",a)}},je=()=>{try{_&&(_.pause(),_.currentTime=0,console.log("🔇 [TTS] Silent audio stopped")),N&&(clearInterval(N),N=null)}catch(a){console.warn("⚠️ [TTS] Silent audio stop failed:",a)}},ur=()=>new Promise((a,e)=>{if(!g)return e(new Error("Speech synthesis not initialized."));if(W=g.getVoices(),W.length>0){a();return}g.onvoiceschanged=()=>{W=g.getVoices(),a()},setTimeout(()=>{W.length===0&&(W=g.getVoices()),a()},1e3)}),Q=()=>{g&&g.speaking&&g.cancel(),X="","mediaSession"in navigator&&navigator.mediaSession.playbackState!=="none"&&(navigator.mediaSession.playbackState="paused"),ze(),je(),window.dispatchEvent(new CustomEvent("otakon:ttsStopped"))},dr=()=>{g&&g.speaking&&!g.paused&&(g.pause(),"mediaSession"in navigator&&(navigator.mediaSession.playbackState="paused"),window.dispatchEvent(new CustomEvent("otakon:ttsPaused")))},gr=()=>{g&&g.paused&&(g.resume(),"mediaSession"in navigator&&(navigator.mediaSession.playbackState="playing"),window.dispatchEvent(new CustomEvent("otakon:ttsResumed")))},mr=async()=>{X&&(Q(),await Xe(X))},hr=()=>g?g.speaking:!1,De=()=>{Q(),window.dispatchEvent(new CustomEvent("otakon:disableHandsFree"))},pr=()=>{"mediaSession"in navigator&&(navigator.mediaSession.setActionHandler("play",()=>{}),navigator.mediaSession.setActionHandler("pause",De),navigator.mediaSession.setActionHandler("stop",De))},fr=async()=>{document.hidden?(we=!0,console.log("📱 [TTS] App went to background, isSpeaking:",g==null?void 0:g.speaking),g&&g.speaking&&(await qe(),g.paused||setTimeout(()=>{g&&g.speaking&&!g.paused&&console.log("📱 [TTS] Nudging speech synthesis to stay alive")},100))):(we=!1,console.log("📱 [TTS] App came to foreground, isSpeaking:",g==null?void 0:g.speaking),g&&g.speaking&&await ve())},yr=async()=>{if(typeof window<"u"&&"speechSynthesis"in window){if(Ge)return;Ge=!0,g=window.speechSynthesis,await ur(),pr(),lr(),document.addEventListener("visibilitychange",fr),g.getVoices().length===0&&g.speak(new SpeechSynthesisUtterance(""))}},Je=()=>W.filter(a=>a.lang.startsWith("en-")),Xe=async a=>new Promise((e,t)=>{try{if(!g)return console.error("Text-to-Speech is not available on this browser."),t(new Error("Text-to-Speech is not available on this browser."));if(!a.trim())return e();Q(),X=a;const r=new SpeechSynthesisUtterance(a),s=localStorage.getItem(cr);r.rate=s?parseFloat(s):.94;const o=localStorage.getItem("otakonPreferredVoiceURI"),n=Je();let i;if(o&&(i=n.find(c=>c.voiceURI===o)),!i&&n.length>0){const c=n.find(l=>l.name.toLowerCase().includes("female"));c?i=c:i=n[0]}i&&(r.voice=i),r.onstart=async()=>{await ve(),await qe(),"serviceWorker"in navigator&&navigator.serviceWorker.controller&&navigator.serviceWorker.controller.postMessage({type:"TTS_STARTED"}),"mediaSession"in navigator&&(navigator.mediaSession.playbackState="playing",navigator.mediaSession.metadata=new MediaMetadata({title:a.length>50?a.substring(0,50)+"...":a,artist:"Your AI Gaming Companion",album:"Otakon",artwork:[{src:"/icon-192.png",sizes:"192x192",type:"image/png"},{src:"/icon-512.png",sizes:"512x512",type:"image/png"}]})),window.dispatchEvent(new CustomEvent("otakon:ttsStarted"))},r.onend=()=>{X="","mediaSession"in navigator&&(navigator.mediaSession.playbackState="paused"),"serviceWorker"in navigator&&navigator.serviceWorker.controller&&navigator.serviceWorker.controller.postMessage({type:"TTS_STOPPED"}),ze(),je(),window.dispatchEvent(new CustomEvent("otakon:ttsStopped")),e()},r.onerror=c=>{console.error("SpeechSynthesis Utterance Error",c),Q(),t(c)},g.speak(r)}catch(r){console.error("TTS Error:",r),t(r)}}),qr={init:yr,getAvailableVoices:Je,speak:Xe,cancel:Q,pause:dr,resume:gr,restart:mr,isSpeaking:hr};class Me{static async acquireMigrationLock(e,t){const r=[e,t].sort().join("|");return this.activeMigrations.has(r)?(console.warn("🔒 [MessageRouting] Migration already in progress:",r),!1):(this.activeMigrations.add(r),setTimeout(()=>{this.activeMigrations.delete(r)},this.LOCK_TIMEOUT),!0)}static releaseMigrationLock(e,t){const r=[e,t].sort().join("|");this.activeMigrations.delete(r)}static async migrateMessagesAtomic(e,t,r){var o,n,i,c;if(console.error("📦 [MessageRouting] Migration requested:",{messageIds:e,from:t,to:r}),!await this.acquireMigrationLock(t,r)){console.warn("⚠️ [MessageRouting] Skipping migration - another migration in progress");return}try{console.error("📦 [MessageRouting] Lock acquired, starting migration");const l=await Ce.getConversations(!1);console.error("📦 [MessageRouting] Loaded conversations:",Object.keys(l));const p=l[t],h=l[r];if(!p)throw console.error("📦 [MessageRouting] Source conversation not found:",t),console.error("📦 [MessageRouting] Available conversations:",Object.keys(l)),new Error(`Source conversation ${t} not found`);if(!h)throw console.error("📦 [MessageRouting] Destination conversation not found:",r),console.error("📦 [MessageRouting] Available conversations:",Object.keys(l)),new Error(`Destination conversation ${r} not found`);console.error("📦 [MessageRouting] Source messages:",(o=p.messages)==null?void 0:o.map(d=>({id:d.id,role:d.role}))),console.error("📦 [MessageRouting] Destination messages before:",(n=h.messages)==null?void 0:n.map(d=>({id:d.id,role:d.role})));const T=p.messages.filter(d=>e.includes(d.id));if(console.error("📦 [MessageRouting] Messages to move:",T.map(d=>({id:d.id,role:d.role}))),T.length===0){console.error("📦 [MessageRouting] No messages found to migrate");return}const w=T.filter(d=>!h.messages.some(E=>E.id===d.id));console.error("📦 [MessageRouting] Messages to add (after duplicate check):",w.map(d=>({id:d.id,role:d.role})));const{FEATURE_FLAGS:b}=await Re(async()=>{const{FEATURE_FLAGS:d}=await import("./chat-services-Cu3qEsr4.js").then(E=>E.g);return{FEATURE_FLAGS:d}},__vite__mapDeps([0,1,2,3,4,5,6,7,8,9,10,11]));if(b.USE_NORMALIZED_MESSAGES&&w.length>0)try{console.error("🔄 [MessageRouting] Updating conversation_id in database for",w.length,"messages");const{supabase:d}=await Re(async()=>{const{supabase:K}=await import("./auth-BtygLHFy.js").then(Qe=>Qe.b);return{supabase:K}},__vite__mapDeps([3,4,5,6,7,8,9,0,1,2,11,10])),E=w.map(K=>K.id),{error:x}=await d.from("messages").update({conversation_id:r}).in("id",E);if(x)throw console.error("❌ [MessageRouting] Failed to update conversation_id in database:",x),x;console.error("✅ [MessageRouting] Database conversation_id updated for",E.length,"messages")}catch(d){throw console.error("❌ [MessageRouting] Database migration failed:",d),d}const m={...l,[r]:{...h,messages:[...h.messages,...w],updatedAt:Date.now()},[t]:{...p,messages:p.messages.filter(d=>!e.includes(d.id)),updatedAt:Date.now()}};console.error("📦 [MessageRouting] Updated source messages:",(i=m[t].messages)==null?void 0:i.map(d=>({id:d.id,role:d.role}))),console.error("📦 [MessageRouting] Updated destination messages:",(c=m[r].messages)==null?void 0:c.map(d=>({id:d.id,role:d.role}))),await Ce.setConversations(m),console.error("✅ [MessageRouting] Migration complete, conversations saved")}finally{this.releaseMigrationLock(t,r)}}static shouldRouteMessage(e,t,r){return!t||e===t?!1:!!(r&&t)}static messageExists(e,t){return e.some(r=>r.id===t)}}y(Me,"activeMigrations",new Set),y(Me,"LOCK_TIMEOUT",1e4);class Sr{constructor(){y(this,"submittedFeedback",new Set)}hasSubmittedFeedback(e){return this.submittedFeedback.has(e)}async submitFeedback(e){try{const t=ee.getCurrentUser();if(!(t!=null&&t.authUserId))return console.warn("[FeedbackService] User not authenticated"),{success:!1,error:"User not authenticated"};if(this.submittedFeedback.has(e.messageId))return console.log("[FeedbackService] Feedback already submitted for message:",e.messageId),{success:!0};const{error:r}=await u.from("ai_feedback").insert({user_id:t.authUserId,conversation_id:e.conversationId,message_id:e.messageId,feedback_type:e.feedbackType,content_type:e.contentType,category:e.category||null,comment:e.comment||null});return r?r.code==="23505"?(console.log("[FeedbackService] Feedback already exists in database"),this.submittedFeedback.add(e.messageId),{success:!0}):(console.error("[FeedbackService] Failed to submit feedback:",r),{success:!1,error:r.message}):(this.submittedFeedback.add(e.messageId),console.log("[FeedbackService] Feedback submitted:",{messageId:e.messageId,type:e.feedbackType,contentType:e.contentType}),{success:!0})}catch(t){return console.error("[FeedbackService] Error submitting feedback:",t),{success:!1,error:"Failed to submit feedback"}}}async submitPositiveFeedback(e,t,r="message"){return this.submitFeedback({messageId:e,conversationId:t,feedbackType:"up",contentType:r})}async submitNegativeFeedback(e,t,r,s,o="message"){return this.submitFeedback({messageId:e,conversationId:t,feedbackType:"down",contentType:o,category:r,comment:s})}async submitCorrection(e){try{const t=ee.getCurrentUser();if(!(t!=null&&t.authUserId))return console.warn("[FeedbackService] User not authenticated for correction"),{success:!1,error:"User not authenticated"};if(!G.getRateLimitStatus().allowed)return{success:!1,error:"Daily correction limit reached. Try again tomorrow.",rateLimitRemaining:0};const s={originalResponse:e.originalResponse,correctionText:e.correctionText,type:e.correctionType,scope:e.correctionScope,gameTitle:e.gameTitle,messageId:e.messageId,conversationId:e.conversationId},o=await G.submitCorrection(t.authUserId,s);return o.success?(console.log("[FeedbackService] Correction submitted successfully:",{messageId:e.messageId,type:e.correctionType,scope:e.correctionScope}),{success:!0,correction:o.correction,rateLimitRemaining:G.getRateLimitStatus().remaining}):{success:!1,error:o.error,rateLimitRemaining:G.getRateLimitStatus().remaining}}catch(t){return console.error("[FeedbackService] Error submitting correction:",t),{success:!1,error:"Failed to submit correction"}}}getCorrectionRateLimit(){return G.getRateLimitStatus()}async getUserCorrections(){const e=ee.getCurrentUser();return e!=null&&e.authUserId?G.getAllCorrections(e.authUserId):[]}async toggleCorrection(e,t){const r=ee.getCurrentUser();return r!=null&&r.authUserId?G.toggleCorrection(r.authUserId,e,t):!1}async getFeedbackStats(){try{const{data:e,error:t}=await u.from("ai_feedback").select("feedback_type, category");if(t)return console.error("[FeedbackService] Failed to get feedback stats:",t),null;const r={totalFeedback:e.length,positiveCount:e.filter(s=>s.feedback_type==="up").length,negativeCount:e.filter(s=>s.feedback_type==="down").length,categoryBreakdown:{}};return e.forEach(s=>{s.category&&(r.categoryBreakdown[s.category]=(r.categoryBreakdown[s.category]||0)+1)}),r}catch(e){return console.error("[FeedbackService] Error getting feedback stats:",e),null}}clearLocalTracking(){this.submittedFeedback.clear()}}const br=new Sr,jr=Object.freeze(Object.defineProperty({__proto__:null,feedbackService:br},Symbol.toStringTag,{value:"Module"}));function Er(a){var n;const e=a.split(","),t=((n=e[0].match(/:(.*?);/))==null?void 0:n[1])||"image/png",r=atob(e[1]),s=r.length,o=new Uint8Array(s);for(let i=0;i<s;i++)o[i]=r.charCodeAt(i);return new Blob([o],{type:t})}async function wr(a,e){try{const t=Er(a),r=t.size,s=50*1024*1024;if(r>s)return{success:!1,error:"Screenshot exceeds 50MB size limit"};const o=Date.now(),n=Math.random().toString(36).substring(2,15),i=`${o}_${n}.png`,c=`${e}/${i}`,{error:l}=await u.storage.from("screenshots").upload(c,t,{contentType:"image/png",cacheControl:"3600",upsert:!1});if(l)return console.error("Screenshot upload error:",l),{success:!1,error:l.message};const{data:p}=u.storage.from("screenshots").getPublicUrl(c);return p!=null&&p.publicUrl?{success:!0,publicUrl:p.publicUrl,fileSize:r}:{success:!1,error:"Failed to generate public URL"}}catch(t){return console.error("Screenshot upload exception:",t),{success:!1,error:t instanceof Error?t.message:"Unknown error"}}}const Jr=Object.freeze(Object.defineProperty({__proto__:null,uploadScreenshot:wr},Symbol.toStringTag,{value:"Module"}));class Tr{constructor(){y(this,"MAX_WORDS",300);y(this,"RECENT_MESSAGE_COUNT",8)}countWords(e){return e.trim().split(/\s+/).filter(t=>t.length>0).length}getTotalWordCount(e){return e.reduce((t,r)=>{const s=this.countWords(r.content);return t+s},0)}shouldSummarize(e){return!e.messages||e.messages.length<=this.RECENT_MESSAGE_COUNT?!1:this.getTotalWordCount(e.messages)>this.MAX_WORDS*3}splitMessages(e){if(e.length<=this.RECENT_MESSAGE_COUNT)return{toSummarize:[],toKeep:e};const t=e.length-this.RECENT_MESSAGE_COUNT;return{toSummarize:e.slice(0,t),toKeep:e.slice(t)}}async summarizeMessages(e,t,r){const s=this.getTotalWordCount(e),o=e.map(c=>`${c.role==="user"?"User":"Assistant"}: ${c.content}`).join(`

`),i=`${t&&r?`This is a conversation about "${t}" (${r}).`:"This is a general conversation."}

Please provide a concise summary of the following conversation history. Focus on:
- Key topics discussed
- Important decisions or choices made
- Game progress or story developments (if applicable)
- User preferences or interests mentioned

Keep the summary under ${this.MAX_WORDS} words while preserving essential context.

Conversation to summarize:
${o}

Provide ONLY the summary, no additional commentary.`;try{const c={id:"temp-summary",title:"Summary Request",messages:[{id:"summary-msg-"+Date.now(),role:"user",content:i,timestamp:Date.now()}],createdAt:Date.now(),updatedAt:Date.now(),isActive:!1,isGameHub:!1},l={id:"system",email:"system@otakon.ai",profileData:null},h=(await nt.getChatResponse(c,l,i,!1,!1)).content.trim(),T=this.countWords(h);return console.log(`✅ [ContextSummarization] Summary generated: ${T} words (reduced from ${s})`),{summary:h,wordCount:T,messagesIncluded:e.length,originalWordCount:s}}catch(c){console.error("❌ [ContextSummarization] Failed to generate summary:",c);const l=e.slice(0,5).map(p=>p.content.substring(0,100)).join(" ... ").substring(0,this.MAX_WORDS*6);return{summary:`[Previous conversation context] ${l}`,wordCount:this.countWords(l),messagesIncluded:e.length,originalWordCount:s}}}async applyContextSummarization(e){if(!this.shouldSummarize(e))return e;const{toSummarize:t,toKeep:r}=this.splitMessages(e.messages);if(t.length===0)return e;const s=await this.summarizeMessages(t,e.gameTitle,e.genre),n=[{id:"summary-"+Date.now(),role:"system",content:s.summary,timestamp:t[t.length-1].timestamp,metadata:{isSummary:!0,messagesIncluded:s.messagesIncluded,originalWordCount:s.originalWordCount,summaryWordCount:s.wordCount}},...r],i=s.summary.replace(/!\[.*?\]\(data:image\/.*?\)/g,""),c=i.split(/\s+/).filter(p=>p.length>0),l=c.length>500?c.slice(0,500).join(" ")+"...":i;return console.log(`✅ [ContextSummarization] Context optimized: ${e.messages.length} messages → ${n.length} (${s.originalWordCount} words → ${s.wordCount} + recent)`),{...e,messages:n,contextSummary:l,lastSummarizedAt:Date.now(),updatedAt:Date.now()}}async getOptimizedContext(e){return this.shouldSummarize(e)?(await this.applyContextSummarization(e)).messages:e.messages}willTriggerSummarization(e){return this.getTotalWordCount(e.messages)>this.MAX_WORDS*3*.8}}const _r=new Tr,Xr=Object.freeze(Object.defineProperty({__proto__:null,contextSummarizationService:_r},Symbol.toStringTag,{value:"Module"}));export{te as E,Me as M,Vr as U,Mr as W,Lr as a,G as b,$r as c,A as d,Wr as e,Fr as f,xr as g,Br as h,B as i,qr as j,Kr as k,zr as l,Yr as m,Dr as n,ht as o,Ur as p,Hr as q,Gr as r,Pr as s,se as t,kr as u,Ir as v,jr as w,Jr as x,Xr as y};
