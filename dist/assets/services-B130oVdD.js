var ot=Object.defineProperty;var nt=(s,e,t)=>e in s?ot(s,e,{enumerable:!0,configurable:!0,writable:!0,value:t}):s[e]=t;var E=(s,e,t)=>nt(s,typeof e!="symbol"?e+"":e,t);import{s as l}from"./auth-Bqsm5OVC.js";import{l as it,g as ct}from"./gaming-services-BALm8AQM.js";import{i as lt,a as oe}from"./core-services-B5iiBVH_.js";import{n as ut,s as dt,S as M,U as gt,T as Pe,a as J,j as L,c as ne,e as mt}from"./chat-services-DbgOgouv.js";import{S as x}from"./storage-services-iagWOljp.js";class ht{constructor(){E(this,"toasts",[]);E(this,"listeners",new Set);E(this,"maxToasts",5)}subscribe(e){return this.listeners.add(e),e(this.toasts),()=>{this.listeners.delete(e)}}notify(){this.listeners.forEach(e=>e([...this.toasts]))}show(e,t="info",r={}){const a=`toast-${Date.now()}-${Math.random().toString(36).substr(2,9)}`,o={id:a,message:e,type:t,duration:r.duration??this.getDefaultDuration(t),action:r.action,dismissible:r.dismissible??!0};return this.toasts.unshift(o),this.toasts.length>this.maxToasts&&(this.toasts=this.toasts.slice(0,this.maxToasts)),this.notify(),o.duration&&o.duration>0&&setTimeout(()=>this.dismiss(a),o.duration),a}success(e,t){return this.show(e,"success",{duration:3e3,...t})}error(e,t){return this.show(e,"error",{duration:7e3,dismissible:!0,...t})}warning(e,t){return this.show(e,"warning",{duration:5e3,...t})}info(e,t){return this.show(e,"info",{duration:4e3,...t})}dismiss(e){const t=this.toasts.findIndex(r=>r.id===e);t!==-1&&(this.toasts.splice(t,1),this.notify())}dismissAll(){this.toasts=[],this.notify()}getDefaultDuration(e){switch(e){case"success":return 3e3;case"error":return 7e3;case"warning":return 5e3;case"info":return 4e3;default:return 4e3}}loading(e){const t=this.show(e,"info",{duration:0,dismissible:!1});return()=>this.dismiss(t)}async promise(e,t){const r=this.loading(t.loading);try{const a=await e;r();const o=typeof t.success=="function"?t.success(a):t.success;return this.success(o),a}catch(a){r();const o=typeof t.error=="function"?t.error(a):t.error;throw this.error(o),a}}}const Z=new ht;let ee=!1;typeof window<"u"&&typeof document<"u"&&(document.addEventListener("visibilitychange",()=>{ee=document.hidden}),window.addEventListener("blur",()=>{ee=!0}),window.addEventListener("focus",()=>{document.hidden||(ee=!1)}));const pt=async(s,e="Otagon AI")=>{if(!(!ee&&!document.hidden)&&!(!("Notification"in window)||Notification.permission!=="granted"))try{const t=s.length>100?s.substring(0,97)+"...":s,r=new Notification(e,{body:t,icon:"/icon-192.png",badge:"/icon-192.png",tag:"otagon-ai-response",requireInteraction:!1,silent:!1});setTimeout(()=>r.close(),1e4),r.onclick=()=>{window.focus(),r.close()}}catch(t){console.error("Failed to show notification:",t)}},ft=()=>ee||document.hidden,Fr=Object.freeze(Object.defineProperty({__proto__:null,isScreenLockedOrHidden:ft,showAINotification:pt,toastService:Z},Symbol.toStringTag,{value:"Module"}));class ie{static handle(e,t,r){this.errorCount++,!this.isErrorRateLimited()&&(console.error(`[${t}]`,{message:e.message,stack:e.stack,context:t,timestamp:new Date().toISOString(),errorCount:this.errorCount}),r&&this.showUserMessage(r),this.reportError(e,t))}static handleAuthError(e,t){const r=this.getAuthErrorMessage(t);this.handle(e,`AuthService:${t}`,r)}static handleWebSocketError(e,t){const r=this.getWebSocketErrorMessage(t);this.handle(e,`WebSocketService:${t}`,r)}static handleConversationError(e,t){const r=this.getConversationErrorMessage(t);this.handle(e,`ConversationService:${t}`,r)}static handleDatabaseError(e,t){const r=this.getDatabaseErrorMessage(t);this.handle(e,`DatabaseService:${t}`,r)}static isErrorRateLimited(){const e=Date.now();return this.recentErrors=this.recentErrors.filter(t=>e-t<this.errorWindow),this.recentErrors.push(e),this.recentErrors.length>this.maxErrorsPerMinute}static showUserMessage(e){}static reportError(e,t){console.warn("[Error Reporting] Would report error to monitoring service:",{error:e.message,context:t,timestamp:new Date().toISOString()})}static getAuthErrorMessage(e){return{signIn:"Failed to sign in. Please check your credentials and try again.",signOut:"Failed to sign out. Please try again.",loadUser:"Failed to load user data. Please refresh the page.",createUser:"Failed to create user account. Please try again.",refreshUser:"Failed to refresh user data. Please try again."}[e]||"An authentication error occurred. Please try again."}static getWebSocketErrorMessage(e){return{connect:"Failed to connect to server. Please check your internet connection.",send:"Failed to send message. Please try again.",disconnect:"Failed to disconnect. Please try again."}[e]||"A connection error occurred. Please try again."}static getConversationErrorMessage(e){return{create:"Failed to create conversation. Please try again.",load:"Failed to load conversations. Please refresh the page.",save:"Failed to save conversation. Please try again.",delete:"Failed to delete conversation. Please try again."}[e]||"A conversation error occurred. Please try again."}static getDatabaseErrorMessage(e){return{save:"Failed to save data. Please try again.",load:"Failed to load data. Please refresh the page.",update:"Failed to update data. Please try again.",delete:"Failed to delete data. Please try again."}[e]||"A database error occurred. Please try again."}static getStats(){return{totalErrors:this.errorCount,recentErrors:this.recentErrors.length,isRateLimited:this.isErrorRateLimited()}}static reset(){this.errorCount=0,this.recentErrors=[]}}E(ie,"errorCount",0),E(ie,"maxErrorsPerMinute",10),E(ie,"errorWindow",60*1e3),E(ie,"recentErrors",[]);const ce=s=>s,W=class W{constructor(){}static getInstance(){return W.instance||(W.instance=new W),W.instance}async getOnboardingStatus(e){try{const{data:t,error:r}=await l.rpc("get_user_onboarding_status",{p_user_id:e});if(r)return console.error("🎯 [OnboardingService] Error getting onboarding status:",r),null;if(!t||t.length===0)return null;const a=t[0];return console.log("🎯 [OnboardingService] Onboarding status (first element):",a),a}catch(t){return console.error("🎯 [OnboardingService] Error getting onboarding status:",t),null}}async updateOnboardingStatus(e,t,r={}){try{const{error:a}=await l.rpc("update_user_onboarding_status",{p_user_id:e,p_step:t,p_data:ce(r)});return a?(console.error("Error updating onboarding status:",a),!1):!0}catch(a){return console.error("Error updating onboarding status:",a),!1}}async getOnboardingProgress(e){try{const{data:t,error:r}=await l.from("onboarding_progress").select("*").eq("user_id",e).order("completed_at",{ascending:!0});return r?(console.error("Error getting onboarding progress:",r),[]):(t||[]).map(a=>({step:a.step,completed_at:a.created_at||"",data:typeof a.data=="object"&&a.data!==null&&!Array.isArray(a.data)?a.data:{}}))}catch(t){return console.error("Error getting onboarding progress:",t),[]}}async markSplashScreensSeen(e){return this.updateOnboardingStatus(e,"initial",{splash_screens_seen:!0,timestamp:new Date().toISOString()})}async markProfileSetupComplete(e,t){try{const{error:r}=await l.from("users").update({has_profile_setup:!0,profile_data:ce(t),updated_at:new Date().toISOString()}).eq("auth_user_id",e);return r?(console.error("Error marking profile setup complete:",r),!1):!0}catch(r){return console.error("Error marking profile setup complete:",r),!1}}async markWelcomeMessageShown(e){return this.updateOnboardingStatus(e,"complete",{welcome_message_shown:!0,timestamp:new Date().toISOString()})}async markOnboardingComplete(e){return this.updateOnboardingStatus(e,"complete",{onboarding_complete:!0,timestamp:new Date().toISOString()})}getBooleanValue(e,t=!1){return e==null?t:!!e}getNextOnboardingStepFromUser(e){const t=this.getBooleanValue(e.hasSeenSplashScreens),r=this.getBooleanValue(e.hasSeenHowToUse),a=this.getBooleanValue(e.hasSeenFeaturesConnected),o=this.getBooleanValue(e.hasSeenProFeatures),n=this.getBooleanValue(e.pcConnected),i=this.getBooleanValue(e.pcConnectionSkipped);return t?t&&!r?"how-to-use":r&&n&&!a?"features-connected":r&&!n&&i&&!o?"pro-features":r&&!n&&!i?"how-to-use":a&&!o?"pro-features":o?"complete":(console.error("🎯 [OnboardingService] ERROR: Unexpected onboarding flow state",{hasSeenSplashScreens:t,hasSeenHowToUse:r,hasSeenFeaturesConnected:a,hasSeenProFeatures:o,pcConnected:n,pcConnectionSkipped:i}),"how-to-use"):"initial"}async getNextOnboardingStep(e){try{const t=await this.getOnboardingStatus(e);if(!t)return"login";const r=this.getBooleanValue(t.has_seen_splash_screens),a=this.getBooleanValue(t.has_seen_how_to_use),o=this.getBooleanValue(t.has_seen_features_connected),n=this.getBooleanValue(t.has_seen_pro_features),i=this.getBooleanValue(t.pc_connected),c=this.getBooleanValue(t.pc_connection_skipped);return r?r&&!a?"how-to-use":a&&i&&!o?"features-connected":a&&!i&&c&&!n?"pro-features":a&&!i&&!c?"how-to-use":o&&!n?"pro-features":n?"complete":(console.error("🎯 [OnboardingService] ERROR: Unexpected onboarding flow state",{hasSeenSplashScreens:r,hasSeenHowToUse:a,hasSeenFeaturesConnected:o,hasSeenProFeatures:n,pcConnected:i,pcConnectionSkipped:c}),"how-to-use"):"initial"}catch(t){return console.error("🎯 [OnboardingService] Error getting next onboarding step:",t),"login"}}async shouldShowOnboarding(e){try{const t=await this.getOnboardingStatus(e);return t?!t.onboarding_completed:!0}catch(t){return console.error("Error checking if should show onboarding:",t),!0}}async trackOnboardingStep(e,t,r,a={}){try{await l.from("user_analytics").insert({user_id:e,auth_user_id:e,event_type:"onboarding_step",event_data:ce({step:t,action:r,data:a,timestamp:new Date().toISOString()})})}catch(o){console.error("Error tracking onboarding step:",o)}}async trackOnboardingDropOff(e,t,r,a={}){try{await l.from("user_analytics").insert({user_id:e,auth_user_id:e,event_type:"onboarding_dropoff",event_data:ce({step:t,reason:r,data:a,timestamp:new Date().toISOString()})})}catch(o){console.error("Error tracking onboarding dropoff:",o)}}async resetOnboarding(e){try{const{error:t}=await l.from("onboarding_progress").delete().eq("user_id",e);if(t)return console.error("Error clearing onboarding progress:",t),!1;const{error:r}=await l.from("users").update({is_new_user:!0,has_seen_splash_screens:!1,has_profile_setup:!1,has_welcome_message:!1,onboarding_completed:!1,onboarding_data:{}}).eq("id",e);return r?(console.error("Error resetting user onboarding flags:",r),!1):!0}catch(t){return console.error("Error resetting onboarding:",t),!1}}async getOnboardingStats(){try{const{count:e}=await l.from("users").select("*",{count:"exact",head:!0}),{count:t}=await l.from("users").select("*",{count:"exact",head:!0}).eq("onboarding_completed",!0),{data:r}=await l.from("user_analytics").select("event_data").eq("event_type","onboarding_dropoff"),a={};return r&&r.forEach(o=>{const n=o.event_data;if(typeof n=="object"&&n!==null&&!Array.isArray(n)){const i=n.step;typeof i=="string"&&(a[i]=(a[i]||0)+1)}}),{total_users:e||0,completed_onboarding:t||0,dropoff_by_step:a}}catch(e){return console.error("Error getting onboarding stats:",e),{total_users:0,completed_onboarding:0,dropoff_by_step:{}}}}};E(W,"instance");let Se=W;const yt=Se.getInstance(),$r=Object.freeze(Object.defineProperty({__proto__:null,onboardingService:yt},Symbol.toStringTag,{value:"Module"}));let b=null;const St="wss://otakon-relay.onrender.com";let X=0;const bt=5e3,be=[];let ue=null,y=null,N=null,de=!0;const Et=3e4,Tt=(s,e,t,r,a)=>{if(b&&(b.readyState===WebSocket.OPEN||b.readyState===WebSocket.CONNECTING))return;if(!/^\d{6}$/.test(s)){const n="Invalid code format. Please enter a 6-digit code.";r(n),Z.error(n);return}ue=s,y={onOpen:e,onMessage:t,onError:r,onClose:a},de=!0;const o=`${St}/${s}`;try{b=new WebSocket(o)}catch(n){const c=`Connection failed: ${n instanceof Error?n.message:"An unknown error occurred."}. Please check the URL and your network connection.`;r(c),Z.error("PC connection failed. Please check your network and try again.");return}b.onopen=()=>{console.log("🔗 [WebSocket] Connection opened successfully to",o),X=0,y&&typeof y.onOpen=="function"&&y.onOpen();try{b==null||b.send(JSON.stringify({type:"connection_request",code:s,ts:Date.now()})),console.log("🔗 [WebSocket] Sent connection_request with code:",s)}catch(n){console.error("🔗 [WebSocket] Failed to send connection_request:",n)}for(;be.length&&b&&b.readyState===WebSocket.OPEN;){const n=be.shift();try{b.send(JSON.stringify(n)),console.log("🔗 [WebSocket] Sent queued message:",n==null?void 0:n.type)}catch(i){console.error("🔗 [WebSocket] Failed to send queued message:",i)}}N&&(clearInterval(N),N=null),N=window.setInterval(()=>{if(b&&b.readyState===WebSocket.OPEN)try{b.send(JSON.stringify({type:"ping",ts:Date.now()}))}catch{}},Et)},b.onmessage=n=>{var i;try{const c=JSON.parse(n.data);if(console.log("🔗 [WebSocket] Message received:",{type:c.type||"unknown",hasDataUrl:!!c.dataUrl,dataUrlLength:(i=c.dataUrl)==null?void 0:i.length,keys:Object.keys(c)}),c.type==="error"||c.error){const u=c.message||c.error||"Connection failed";console.error("🔗 [WebSocket] Server error:",u),localStorage.removeItem("otakon_connection_code"),localStorage.removeItem("otakon_last_connection"),y&&typeof y.onError=="function"&&y.onError(u);return}if(c.type==="no_partner"||c.type==="partner_not_found"||c.type==="invalid_code"){const u="No PC client found with this code. Please check the code and ensure the PC client is running.";console.error("🔗 [WebSocket] No partner found:",c),localStorage.removeItem("otakon_connection_code"),localStorage.removeItem("otakon_last_connection"),y&&typeof y.onError=="function"&&y.onError(u);return}if((c.type==="partner_disconnected"||c.type==="partner_left"||c.type==="peer_disconnected")&&console.log("🔗 [WebSocket] Partner disconnected - PC app closed or lost connection"),(c.type==="screenshot_success"||c.type==="screenshot_batch"||c.type==="screenshot")&&console.log("🔗 [WebSocket] Full screenshot message:",JSON.stringify(c).substring(0,500)),y&&typeof y.onMessage=="function"){console.log("🔗 [WebSocket] Invoking onMessage handler with data:",c.type);try{y.onMessage(c),console.log("🔗 [WebSocket] Handler completed successfully")}catch(u){console.error("🔗 [WebSocket] Handler threw error:",u)}}else console.error("🔗 [WebSocket] No valid onMessage handler!",y)}catch(c){console.error("🔗 [WebSocket] Failed to parse message:",n.data,c)}},b.onerror=()=>{},b.onclose=n=>{if(console.log("🔗 [WebSocket] Connection closed:",{wasClean:n.wasClean,code:n.code,reason:n.reason}),!n.wasClean){let i="Connection closed unexpectedly.";n.code===1006?(i="Connection to the server failed. Please check your network, verify the code, and ensure the PC client is running.",X===0&&Z.warning("PC connection lost. Attempting to reconnect...")):n.reason&&(i=`Connection closed: ${n.reason}`),y&&typeof y.onError=="function"&&y.onError(i)}if(b=null,y&&typeof y.onClose=="function"&&y.onClose(),N&&(clearInterval(N),N=null),de&&ue&&y){X+=1;const i=Math.min(bt,500*Math.pow(2,X-1)),c=Math.random()*300,u=i+c;setTimeout(()=>{!b&&y&&de&&Tt(ue,y.onOpen,y.onMessage,y.onError,y.onClose)},u)}}},Wr=s=>{b&&b.readyState===WebSocket.OPEN?b.send(JSON.stringify(s)):be.push(s)},Br=()=>{de=!1,b&&(b.close(1e3,"User disconnected"),b=null),X=0,N&&(clearInterval(N),N=null),ue=null,y=null},Hr=(s,e,t,r)=>{y={onOpen:s,onMessage:e,onError:t,onClose:r},console.log("🔗 [WebSocket] Handlers updated")};class Kr{static async addToWaitlist(e,t="landing_page"){try{const{data:r,error:a}=await l.from("waitlist").insert({email:e,source:t,status:"pending"}).select();if(a){if(console.error("Error adding to waitlist:",a),console.error("Insert error details:",{message:a.message,code:a.code,details:a.details,hint:a.hint}),a.code==="23505")return{success:!0,alreadyExists:!0,error:"You're already on our waitlist! We'll email you when access is ready."};const{data:o,error:n}=await l.from("waitlist").select("email, status, created_at").eq("email",e).maybeSingle();return n?(console.error("Error checking existing email:",n),{success:!1,error:`Failed to add to waitlist: ${a.message}`}):o?{success:!0,alreadyExists:!0,error:"You're already on our waitlist! We'll email you when access is ready."}:{success:!1,error:`Failed to add to waitlist: ${a.message}`}}return{success:!0,alreadyExists:!1,error:void 0}}catch(r){return console.error("Waitlist service error:",r),{success:!1,error:"An unexpected error occurred"}}}static async getWaitlistCount(){try{const{count:e,error:t}=await l.from("waitlist").select("*",{count:"exact",head:!0});return t?(console.error("Error getting waitlist count:",t),{error:"Failed to get count"}):{count:e||0}}catch(e){return console.error("Error getting waitlist count:",e),{error:"Failed to get count"}}}static async getWaitlistStats(){try{const{data:e,error:t}=await l.from("waitlist").select("status");if(t)return console.error("Error fetching waitlist stats:",t),{total:137,pending:137,invited:0,converted:0};const r={total:e.length,pending:0,invited:0,converted:0};return e.forEach(a=>{const o=a.status||"pending";o==="pending"?r.pending++:o==="approved"?r.invited++:o==="rejected"&&r.converted++}),r}catch(e){return console.error("Error fetching waitlist stats:",e),{total:137,pending:137,invited:0,converted:0}}}}const Yr=s=>{const e=new Map;let t=s;console.log(`🏷️ [otakonTags] Parsing response (${s.length} chars)...`);const r=[/Internal Data Structure:?\s*\n*\s*```json\s*([\s\S]*?)```/i,/Internal Data Structure:?\s*\n*\s*```\s*([\s\S]*?)```/i,/Internal Data Structure:?\s*\n*(\{[\s\S]*?"followUpPrompts"[\s\S]*?\})\s*$/i,/"Internal Data Structure":?\s*\n*(\{[\s\S]*?"followUpPrompts"[\s\S]*?\})/i];for(const h of r){const d=s.match(h);if(d&&d[1])try{const m=d[1].trim(),f=JSON.parse(m);if(console.log("🏷️ [otakonTags] Found Internal Data Structure JSON:",Object.keys(f)),f.followUpPrompts&&Array.isArray(f.followUpPrompts)&&(e.set("SUGGESTIONS",f.followUpPrompts),console.log("🏷️ [otakonTags] ✅ Extracted followUpPrompts from JSON:",f.followUpPrompts)),f.stateUpdateTags&&Array.isArray(f.stateUpdateTags))for(const _ of f.stateUpdateTags){const I=String(_).match(/PROGRESS[:\s]+(\d+)/i);if(I){const ae=parseInt(I[1],10);ae>=0&&ae<=100&&(e.set("PROGRESS",ae),console.log(`📊 [otakonTags] ✅ Extracted PROGRESS from stateUpdateTags: ${ae}%`))}const C=String(_).match(/OBJECTIVE[:\s]+(.+)/i);C&&(e.set("OBJECTIVE",C[1].trim()),console.log("🎯 [otakonTags] ✅ Extracted OBJECTIVE from stateUpdateTags"))}f.progressiveInsightUpdates&&Array.isArray(f.progressiveInsightUpdates)&&(e.set("SUBTAB_UPDATE",f.progressiveInsightUpdates),console.log(`📑 [otakonTags] ✅ Extracted ${f.progressiveInsightUpdates.length} subtab updates from JSON`));break}catch(m){console.warn("[otakonTags] Failed to parse Internal Data Structure JSON:",m)}}if(!e.has("SUGGESTIONS")){const h=s.match(/\{[\s\S]*?"followUpPrompts"\s*:\s*\[([\s\S]*?)\][\s\S]*?\}/);if(h)try{const d=s.indexOf(h[0]);let m=0,f=d;for(let C=d;C<s.length;C++)if(s[C]==="{"&&m++,s[C]==="}"&&(m--,m===0)){f=C+1;break}const _=s.substring(d,f),I=JSON.parse(_);I.followUpPrompts&&Array.isArray(I.followUpPrompts)&&(e.set("SUGGESTIONS",I.followUpPrompts),console.log("🏷️ [otakonTags] ✅ Extracted followUpPrompts from embedded JSON:",I.followUpPrompts))}catch{try{const m=s.match(/"followUpPrompts"\s*:\s*\[([^\]]+)\]/);if(m){const f=JSON.parse(`[${m[1]}]`);Array.isArray(f)&&f.length>0&&(e.set("SUGGESTIONS",f),console.log("🏷️ [otakonTags] ✅ Extracted followUpPrompts array:",f))}}catch{console.warn("[otakonTags] Could not extract followUpPrompts from JSON")}}}const a=/\[OTAKON_SUGGESTIONS:\s*(\[[\s\S]*?\])\s*\]/g;let o;for(;(o=a.exec(s))!==null;)try{const h=o[1].replace(/'/g,'"'),d=JSON.parse(h);e.set("SUGGESTIONS",d),t=t.replace(o[0],""),console.log("🏷️ [otakonTags] Extracted SUGGESTIONS:",d)}catch{console.warn("[OtakonTags] Failed to parse SUGGESTIONS JSON:",o[1])}const n=/\[OTAKON_SUBTAB_UPDATE:\s*\{[^\]]*\}\s*\]/g;let i;const c=[];for(;(i=n.exec(s))!==null;){try{const h=i[0].match(/\{[^\]]*\}/);if(h){const d=JSON.parse(h[0]);c.push(d)}}catch{console.warn("[OtakonTags] Failed to parse SUBTAB_UPDATE JSON:",i[0])}t=t.replace(i[0],"")}c.length>0&&e.set("SUBTAB_UPDATE",c);const u=/\[OTAKON_SUBTAB_CONSOLIDATE:\s*\{[^\]]*\}\s*\]/g;let S;const T=[];for(;(S=u.exec(s))!==null;){try{const h=S[0].match(/\{[^\]]*\}/);if(h){const d=JSON.parse(h[0]);T.push(d),console.log("📦 [otakonTags] Extracted SUBTAB_CONSOLIDATE:",d)}}catch{console.warn("[OtakonTags] Failed to parse SUBTAB_CONSOLIDATE JSON:",S[0])}t=t.replace(S[0],"")}T.length>0&&e.set("SUBTAB_CONSOLIDATE",T);let p=null;const A=s.match(/\[OTAKON_PROGRESS[:\s]+(\d+)/i);if(A&&(p=parseInt(A[1],10),console.log(`📊 [otakonTags] Found OTAKON_PROGRESS format: ${A[0]} → ${p}%`)),!p){const h=s.match(/\[?PROGRESS[:\s]+(\d+)/i);h&&(p=parseInt(h[1],10),console.log(`📊 [otakonTags] Found PROGRESS format: ${h[0]} → ${p}%`))}if(!p){const h=s.match(/(?:progress|completion|game progress)[:\s]+(?:approximately\s+)?(\d+)\s*%/i);h&&(p=parseInt(h[1],10),console.log(`📊 [otakonTags] Found inline progress format: ${h[0]} → ${p}%`))}if(!p){const h=s.match(/"stateUpdateTags"[^}]*"PROGRESS[:\s]+(\d+)/i);h&&(p=parseInt(h[1],10),console.log(`📊 [otakonTags] Found stateUpdateTags PROGRESS: ${h[0]} → ${p}%`))}p!==null&&p>=0&&p<=100?(e.set("PROGRESS",p),console.log(`📊 [otakonTags] ✅ Set PROGRESS tag to: ${p}%`)):console.log("📊 [otakonTags] ⚠️ No valid progress found in response");const Y=/\[OTAKON_([A-Z_]+):\s*([^[\]]+?)\]/g;let P;for(;(P=Y.exec(s))!==null;){const h=P[1];let d=P[2].trim();if(console.log(`🏷️ [otakonTags] Found tag: ${h} = ${P[2].substring(0,50)}`),!(h==="SUGGESTIONS"||h==="SUBTAB_UPDATE")){try{const m=d;m.startsWith("{")&&m.endsWith("}")&&(d=JSON.parse(m)),m.startsWith("[")&&m.endsWith("]")&&(d=JSON.parse(m.replace(/'/g,'"')))}catch{}if(h==="PROGRESS"){const m=String(d).trim(),f=m.match(/(\d+)/);if(f){const _=parseInt(f[1],10);d=Math.min(100,Math.max(0,_)),console.log(`📊 [otakonTags] Parsed PROGRESS: "${m}" → ${d}`)}else console.warn(`📊 [otakonTags] Could not parse PROGRESS value: "${m}"`)}e.set(h,d),t=t.replace(P[0],"")}}return t=t.replace(/^I['']?m\s+Otagon,\s+your\s+dedicated\s+gaming\s+lore\s+expert[^\n]*\n*/i,"").replace(/\[OTAKON_SUGGESTIONS:[^\]]*\]/gi,"").replace(/\[OTAKON_[A-Z_]+:[^\]]*\]/g,"").replace(/\*+\s*#+\s*Internal Data Structure[\s\S]*$/gi,"").replace(/\*+\s*Internal Data Structure[\s\S]*$/gi,"").replace(/#+\s*Internal Data Structure[\s\S]*$/gi,"").replace(/Internal Data Structure:?[\s\S]*$/gi,"").replace(/"Internal Data Structure":?[\s\S]*$/gi,"").replace(/\{[\s\S]*?"followUpPrompts"[\s\S]*?\}\s*$/gi,"").replace(/\{[\s\S]*?"progressiveInsightUpdates"[\s\S]*?\}\s*$/gi,"").replace(/\{[\s\S]*?"stateUpdateTags"[\s\S]*?\}\s*$/gi,"").replace(/\{[\s\S]*?"gamePillData"[\s\S]*?\}\s*$/gi,"").replace(/```json[\s\S]*?```/gi,"").replace(/```\s*\{[\s\S]*?```/gi,"").replace(/\]\s*$/g,"").replace(/\}\s*$/g,"").trim(),e.size>0&&console.log(`🏷️ [otakonTags] Extracted ${e.size} tags:`,Array.from(e.keys()).join(", ")),{cleanContent:t,tags:e}},B=class B{static getInstance(){return B.instance||(B.instance=new B),B.instance}generateCacheKey(e,t){var n;const r={prompt:e.trim().toLowerCase(),gameTitle:(n=t.gameTitle)==null?void 0:n.toLowerCase(),mode:t.mode},a=JSON.stringify(r);let o=0;for(let i=0;i<a.length;i++){const c=a.charCodeAt(i);o=(o<<5)-o+c,o=o&o}return Math.abs(o).toString(36)}async getCachedResponse(e){try{const{data:t,error:r}=await l.from("ai_responses").select("response_data, created_at, model_used, tokens_used, cache_type").eq("cache_key",e).gt("expires_at",new Date().toISOString()).single();if(r)return r.code==="PGRST116"?(console.log("❌ [aiCacheService] Cache MISS:",e.substring(0,8)),null):(console.error("❌ [aiCacheService] Error checking cache:",r),null);if(t){const a=t.created_at?Math.floor((Date.now()-new Date(t.created_at).getTime())/1e3/60):0;return console.log("✅ [aiCacheService] Cache HIT:",e.substring(0,8),{age:`${a}m`,model:t.model_used,tokens:t.tokens_used,type:t.cache_type}),t.response_data}return null}catch(t){return console.error("Error in getCachedResponse:",t),null}}async cacheResponse(e,t,r){try{const a=new Date;a.setHours(a.getHours()+r.ttlHours);const{data:{user:o}}=await l.auth.getUser(),{error:n}=await l.from("ai_responses").upsert({cache_key:e,response_data:JSON.parse(JSON.stringify(t)),game_title:r.gameTitle,cache_type:r.cacheType,conversation_id:r.conversationId,model_used:r.modelUsed,tokens_used:r.tokensUsed,user_id:o==null?void 0:o.id,expires_at:a.toISOString(),created_at:new Date().toISOString()},{onConflict:"cache_key"});return n?(console.error("Error caching response:",n),!1):(console.log("💾 Cached response:",e.substring(0,8),{type:r.cacheType,ttl:r.ttlHours+"h",tokens:r.tokensUsed,game:r.gameTitle}),!0)}catch(a){return console.error("Error in cacheResponse:",a),!1}}determineCacheType(e){return e.gameTitle?"game_specific":e.hasUserContext||e.conversationId?"user":"global"}determineTTL(e,t){switch(e){case"global":return 168;case"game_specific":return 24;case"user":return 12;default:return 24}}shouldCache(e,t){if(console.log(`🔍 [aiCacheService] shouldCache called with prompt: "${e.substring(0,50)}..."`,t),t.noCache===!0)return!1;if(e.trim().length<10)return console.log(`❌ [aiCacheService] Not caching: prompt too short (${e.trim().length} chars)`),!1;const r=["today","now","current","latest","recent","just released"],a=e.toLowerCase();return!r.find(n=>a.includes(n))}async cleanupExpiredCache(){try{const{data:e,error:t}=await l.from("ai_responses").delete().lt("expires_at",new Date().toISOString()).select("id");return t?(console.error("Error cleaning up cache:",t),{deleted:0}):{deleted:(e==null?void 0:e.length)||0}}catch(e){return console.error("Error in cleanupExpiredCache:",e),{deleted:0}}}async getCacheStats(){try{const{data:e,error:t}=await l.from("ai_responses").select("cache_type, tokens_used").gt("expires_at",new Date().toISOString());if(t)return console.error("Error getting cache stats:",t),{totalEntries:0,byType:{},totalTokensSaved:0};const r={totalEntries:e.length,byType:{},totalTokensSaved:e.reduce((a,o)=>a+(o.tokens_used||0),0)};return e.forEach(a=>{const o=a.cache_type||"unknown";r.byType[o]=(r.byType[o]||0)+1}),r}catch(e){return console.error("Error in getCacheStats:",e),{totalEntries:0,byType:{},totalTokensSaved:0}}}async invalidateGameCache(e){try{const{error:t}=await l.from("ai_responses").delete().eq("game_title",e).eq("cache_type","game_specific");return t?(console.error("Error invalidating game cache:",t),!1):!0}catch(t){return console.error("Error in invalidateGameCache:",t),!1}}};E(B,"instance");let Ee=B;const qr=Ee.getInstance(),H=class H{constructor(){}static getInstance(){return H.instance||(H.instance=new H),H.instance}generateProfileSpecificTabs(e,t){const r=[];return e.playerFocus==="Story-Driven"&&r.push({id:"narrative_themes",title:"Narrative Themes",type:"story",priority:"high",isProfileSpecific:!0,instruction:this.getNarrativeThemesInstruction(e.hintStyle)}),e.playerFocus==="Completionist"&&r.push({id:"secret_hunting",title:"Secret Hunting",type:"tips",priority:"high",isProfileSpecific:!0,instruction:this.getSecretHuntingInstruction(e.hintStyle)}),e.playerFocus==="Strategist"&&r.push({id:"optimization_guide",title:"Optimization Guide",type:"strategies",priority:"high",isProfileSpecific:!0,instruction:this.getOptimizationInstruction(e.hintStyle)}),t!=null&&t.playthroughCount&&t.playthroughCount>1&&r.push({id:"playthrough_comparison",title:"Playthrough Comparison",type:"tips",priority:"medium",isProfileSpecific:!0,instruction:this.getPlaythroughComparisonInstruction(e)}),r}getNarrativeThemesInstruction(e){const t={Cryptic:"Provide subtle hints about story themes without revealing major plot points. Use metaphorical language and thematic connections.",Balanced:"Discuss narrative elements with moderate detail, balancing spoiler avoidance with meaningful insight into themes and character arcs.",Direct:"Explain story themes clearly while maintaining appropriate spoiler warnings. Provide direct analysis of narrative elements encountered so far."};return t[e]||t.Balanced}getSecretHuntingInstruction(e){const t={Cryptic:"Give mysterious clues about hidden content locations. Use environmental riddles and subtle hints that require exploration.",Balanced:"Provide clear directions to secrets with some exploration challenge. Balance helpfulness with maintaining the joy of discovery.",Direct:"Give precise locations and requirements for finding secrets. Include step-by-step instructions and exact coordinates when helpful."};return t[e]||t.Balanced}getOptimizationInstruction(e){const t={Cryptic:"Suggest optimization strategies through hints and examples. Let the player discover the optimal path with guidance.",Balanced:"Provide balanced optimization advice with clear explanations. Suggest effective approaches while leaving room for experimentation.",Direct:"Give specific optimization recommendations with detailed steps. Provide exact stat allocations, builds, and strategies for maximum efficiency."};return t[e]||t.Direct}getPlaythroughComparisonInstruction(e){return`Compare different playthrough approaches based on ${e.playerFocus} style and ${e.hintStyle} preferences. Highlight what's different this time and suggest new strategies to explore.`}prioritizeTabsForProfile(e,t){return e.sort((r,a)=>{if(r.isProfileSpecific&&!a.isProfileSpecific)return-1;if(!r.isProfileSpecific&&a.isProfileSpecific)return 1;const o={high:3,medium:2,low:1};return o[a.priority]-o[r.priority]})}getHintStyleModifier(e){const t={Cryptic:"Use subtle, metaphorical hints. Avoid direct answers. Make the player think and discover.",Balanced:"Provide clear guidance while leaving room for exploration. Balance helpfulness with discovery.",Direct:"Give explicit, step-by-step instructions. Be precise and comprehensive in explanations."};return t[e]||t.Balanced}getPlayerFocusModifier(e){const t={"Story-Driven":"Emphasize narrative elements, character development, and story context. Prioritize lore and thematic content.",Completionist:"Focus on collectibles, hidden items, side quests, and 100% completion strategies. Highlight missable content.",Strategist:"Prioritize optimal strategies, build optimization, and efficient progression. Focus on mechanics and systems."};return t[e]||t.Strategist}getSpoilerToleranceModifier(e){const t={Strict:"NEVER mention future events, characters, or plot points. Only discuss content up to current progress.",Moderate:"You may hint at upcoming content in vague terms, but avoid specific spoilers.",Relaxed:"You can discuss future content more freely, but still mark major spoilers clearly."};return t[e]||t.Strict}getToneModifier(e){const t={Encouraging:"Use an enthusiastic, supportive tone. Celebrate achievements and provide positive reinforcement.",Professional:"Maintain a knowledgeable, respectful tone. Provide expertise without excessive casualness.",Casual:"Use a friendly, conversational tone. Feel free to use gaming terminology and be relaxed."};return t[e]||t.Professional}buildProfileContext(e){return[`Hint Style: ${this.getHintStyleModifier(e.hintStyle)}`,`Player Focus: ${this.getPlayerFocusModifier(e.playerFocus)}`,`Spoiler Tolerance: ${this.getSpoilerToleranceModifier(e.spoilerTolerance)}`,`Tone: ${this.getToneModifier(e.preferredTone)}`].join(`
`)}getDefaultProfile(){return{hintStyle:"Balanced",playerFocus:"Strategist",preferredTone:"Professional",spoilerTolerance:"Strict"}}};E(H,"instance");let Te=H;const j=Te.getInstance(),fe=new Map;async function Fe(s){const e=fe.get(s);if(e)return await e,Fe(s);let t=()=>{};const r=new Promise(a=>{t=a});return fe.set(s,r),()=>{fe.delete(s),t()}}const $e={responseHistoryScope:"game",applyCorrections:!0,correctionDefaultScope:"game"},Ge={aiCorrections:[],aiPreferences:$e,responseTopicsCache:{}},wt=20,De=5,Ue=10;async function v(s){try{const{data:e,error:t}=await l.from("users").select("behavior_data").eq("auth_user_id",s).single();if(t)return console.error("[BehaviorService] Error fetching behavior_data:",t),Ge;const r=(e==null?void 0:e.behavior_data)||{};return{aiCorrections:r.aiCorrections||[],aiPreferences:{...$e,...r.aiPreferences},responseTopicsCache:r.responseTopicsCache||{}}}catch(e){return console.error("[BehaviorService] Exception fetching behavior_data:",e),Ge}}async function k(s,e){const t=await Fe(s);try{const r=await v(s),a={...r,...e,aiPreferences:e.aiPreferences?{...r.aiPreferences,...e.aiPreferences}:r.aiPreferences},{error:o}=await l.from("users").update({behavior_data:a}).eq("auth_user_id",s);return o?(console.error("[BehaviorService] Error updating behavior_data:",o),!1):!0}catch(r){return console.error("[BehaviorService] Exception updating behavior_data:",r),!1}finally{t()}}async function _t(s,e,t="game"){if(t==="off")return[];const r=await v(s);if(t==="global")return Object.values(r.responseTopicsCache).flat().slice(0,50);const a=e||"game-hub";return r.responseTopicsCache[a]||[]}async function At(s,e,t){if(!t.length)return;const r=await v(s),a=e||"game-hub",o=r.responseTopicsCache[a]||[],n=[...t,...o],i=[...new Set(n)].slice(0,wt);r.responseTopicsCache[a]=i,await k(s,{responseTopicsCache:r.responseTopicsCache})}async function Ot(s,e){const t=await v(s);if(e===void 0)await k(s,{responseTopicsCache:{}});else{const r=e||"game-hub";delete t.responseTopicsCache[r],await k(s,{responseTopicsCache:t.responseTopicsCache})}}async function vt(s){return(await v(s)).aiPreferences}async function Ct(s,e){const t=await v(s);return k(s,{aiPreferences:{...t.aiPreferences,...e}})}async function It(s,e=null,t=!0){return(await v(s)).aiCorrections.filter(a=>a.isActive?a.scope==="game"?a.gameTitle===e:t&&a.scope==="global":!1)}async function Nt(s,e){const t=await v(s),r=t.aiCorrections.filter(i=>i.isActive&&i.scope==="game"&&i.gameTitle===e.gameTitle),a=t.aiCorrections.filter(i=>i.isActive&&i.scope==="global");if(e.scope==="game"&&r.length>=De)return{success:!1,error:`Maximum ${De} corrections per game reached`};if(e.scope==="global"&&a.length>=Ue)return{success:!1,error:`Maximum ${Ue} global corrections reached`};const o={...e,id:crypto.randomUUID(),isActive:!0,appliedCount:0,createdAt:new Date().toISOString()};return t.aiCorrections.push(o),{success:await k(s,{aiCorrections:t.aiCorrections})}}async function Rt(s,e,t){const r=await v(s),a=r.aiCorrections.find(o=>o.id===e);return a?(a.isActive=t,k(s,{aiCorrections:r.aiCorrections})):!1}async function kt(s,e){const t=await v(s);return t.aiCorrections=t.aiCorrections.filter(r=>r.id!==e),k(s,{aiCorrections:t.aiCorrections})}async function Pt(s,e){const t=await v(s),r=t.aiCorrections.find(a=>a.id===e);r&&(r.appliedCount++,await k(s,{aiCorrections:t.aiCorrections}))}const R={getBehaviorData:v,updateBehaviorData:k,getResponseTopics:_t,addResponseTopics:At,clearResponseTopics:Ot,getAIPreferences:vt,updateAIPreferences:Ct,getActiveCorrections:It,addCorrection:Nt,toggleCorrection:Rt,removeCorrection:kt,incrementCorrectionApplied:Pt},Gt=1440*60*1e3,Vr={async getCache(s){try{const{data:e,error:t}=await l.from("news_cache").select("*").eq("prompt_type",s).gte("expires_at",new Date().toISOString()).order("cached_at",{ascending:!1}).limit(1).single();return t?(t.code==="PGRST116"||console.error("[NewsCache] Error fetching cache:",t),null):e?e.news_items:null}catch(e){return console.error("[NewsCache] Error in getCache:",e),null}},async setCache(s,e){try{const t=new Date,r=new Date(t.getTime()+Gt);await l.from("news_cache").delete().eq("prompt_type",s);const{error:a}=await l.from("news_cache").insert({prompt_type:s,news_items:e,cached_at:t.toISOString(),expires_at:r.toISOString()});return a?(console.error("[NewsCache] Error storing cache:",a),!1):(console.log(`[NewsCache] Stored ${e.length} items for "${s}" (expires in 24h)`),!0)}catch(t){return console.error("[NewsCache] Error in setCache:",t),!1}},async hasValidCache(s){const e=await this.getCache(s);return e!==null&&e.length>0},async clearExpired(){try{const{data:s,error:e}=await l.from("news_cache").delete().lt("expires_at",new Date().toISOString()).select();if(e)return console.error("[NewsCache] Error clearing expired:",e),0;const t=(s==null?void 0:s.length)||0;return console.log(`[NewsCache] Cleared ${t} expired entries`),t}catch(s){return console.error("[NewsCache] Error in clearExpired:",s),0}},async getCacheAge(s){try{const{data:e,error:t}=await l.from("news_cache").select("cached_at").eq("prompt_type",s).gte("expires_at",new Date().toISOString()).order("cached_at",{ascending:!1}).limit(1).single();if(t||!e)return null;const r=new Date(e.cached_at).getTime();return(Date.now()-r)/(3600*1e3)}catch{return null}}},zr={async getAll(s){try{const{data:e,error:t}=await l.from("user_library").select("*").eq("auth_user_id",s).order("date_added",{ascending:!1});return t?(console.error("[LibrarySync] Error fetching library:",t),[]):(e||[]).map(r=>({id:r.id,igdbGameId:r.igdb_game_id,gameName:r.game_title,category:r.category,platform:r.platform,personalRating:r.personal_rating,completionStatus:r.completion_status,hoursPlayed:r.hours_played?parseFloat(r.hours_played):void 0,notes:r.notes,igdbData:r.igdb_data,dateAdded:new Date(r.date_added).getTime(),updatedAt:new Date(r.updated_at).getTime()}))}catch(e){return console.error("[LibrarySync] Error in getAll:",e),[]}},async add(s,e){try{const{error:t}=await l.from("user_library").insert({auth_user_id:s,igdb_game_id:e.igdbGameId,game_title:e.gameName,category:e.category,platform:e.platform,personal_rating:e.personalRating,completion_status:e.completionStatus,hours_played:e.hoursPlayed,notes:e.notes,igdb_data:e.igdbData||{},date_added:new Date(e.dateAdded).toISOString(),updated_at:new Date(e.updatedAt).toISOString()});return t?t.code==="23505"?(console.log("[LibrarySync] Item already exists, updating instead"),this.update(s,e)):(console.error("[LibrarySync] Error adding to library:",t),!1):!0}catch(t){return console.error("[LibrarySync] Error in add:",t),!1}},async update(s,e){try{const{error:t}=await l.from("user_library").update({platform:e.platform,personal_rating:e.personalRating,completion_status:e.completionStatus,hours_played:e.hoursPlayed,notes:e.notes,igdb_data:e.igdbData||{},updated_at:new Date().toISOString()}).eq("auth_user_id",s).eq("igdb_game_id",e.igdbGameId).eq("category",e.category);return t?(console.error("[LibrarySync] Error updating library:",t),!1):!0}catch(t){return console.error("[LibrarySync] Error in update:",t),!1}},async remove(s,e,t){try{const{error:r}=await l.from("user_library").delete().eq("auth_user_id",s).eq("igdb_game_id",e).eq("category",t);return r?(console.error("[LibrarySync] Error removing from library:",r),!1):!0}catch(r){return console.error("[LibrarySync] Error in remove:",r),!1}},async syncFromLocalStorage(s,e){console.log(`[LibrarySync] Syncing ${e.length} items from localStorage to Supabase...`);for(const t of e)await this.add(s,t);console.log("[LibrarySync] Sync complete")}},jr={async getAll(s){try{const{data:e,error:t}=await l.from("user_timeline").select("*").eq("auth_user_id",s).order("event_date",{ascending:!1});return t?(console.error("[TimelineSync] Error fetching timeline:",t),[]):(e||[]).map(r=>{var a,o,n,i,c;return{id:r.id,type:r.event_type,eventDate:new Date(r.event_date).toISOString().split("T")[0],year:new Date(r.event_date).getFullYear(),title:r.event_title,description:r.event_description,specs:(a=r.event_data)==null?void 0:a.specs,photos:(o=r.event_data)==null?void 0:o.photos,igdbGameId:r.igdb_game_id,igdbData:(n=r.event_data)==null?void 0:n.igdbData,screenshotCount:(i=r.event_data)==null?void 0:i.screenshotCount,aiSummary:(c=r.event_data)==null?void 0:c.aiSummary,createdAt:new Date(r.created_at).getTime(),updatedAt:new Date(r.created_at).getTime()}})}catch(e){return console.error("[TimelineSync] Error in getAll:",e),[]}},async add(s,e){var t;try{const{error:r}=await l.from("user_timeline").insert({auth_user_id:s,event_type:e.type,event_title:e.title,event_description:e.description,event_data:{specs:e.specs,photos:e.photos,igdbData:e.igdbData,screenshotCount:e.screenshotCount,aiSummary:e.aiSummary},game_title:(t=e.igdbData)==null?void 0:t.name,igdb_game_id:e.igdbGameId,event_date:new Date(e.eventDate).toISOString(),created_at:new Date(e.createdAt).toISOString()});return r?(console.error("[TimelineSync] Error adding event:",r),!1):!0}catch(r){return console.error("[TimelineSync] Error in add:",r),!1}},async remove(s,e){try{const{error:t}=await l.from("user_timeline").delete().eq("auth_user_id",s).eq("id",e);return t?(console.error("[TimelineSync] Error removing event:",t),!1):!0}catch(t){return console.error("[TimelineSync] Error in remove:",t),!1}},async syncFromLocalStorage(s,e){console.log(`[TimelineSync] Syncing ${e.length} events from localStorage to Supabase...`);for(const t of e)await this.add(s,t);console.log("[TimelineSync] Sync complete")}},Jr={async getAll(s){try{const{data:e,error:t}=await l.from("user_screenshots").select("*").eq("auth_user_id",s).order("captured_at",{ascending:!1});return t?(console.error("[ScreenshotsSync] Error fetching screenshots:",t),[]):(e||[]).map(r=>({id:r.id,sessionId:"",messageId:"",conversationId:r.conversation_id||"",screenshotUrl:r.screenshot_url,aiAnalysis:"",capturedAt:new Date(r.captured_at).getTime()}))}catch(e){return console.error("[ScreenshotsSync] Error in getAll:",e),[]}},async add(s,e,t){try{const{error:r}=await l.from("user_screenshots").insert({auth_user_id:s,screenshot_url:e.screenshotUrl,game_title:t,conversation_id:e.conversationId,captured_at:new Date(e.capturedAt).toISOString()});return r?(console.error("[ScreenshotsSync] Error adding screenshot:",r),!1):!0}catch(r){return console.error("[ScreenshotsSync] Error in add:",r),!1}}};function Dt(s){const e=[];return s.interactionType==="suggested_prompt"?e.push(`
**💡 SUGGESTED PROMPT CLICKED:**
The user clicked a suggested follow-up prompt. This means:
- They want a DIRECT answer to this specific question
- Keep your response focused and concise
- Don't repeat information from the previous response
- Build on what was just discussed
`):s.interactionType==="image_upload"?e.push(`
**📸 IMAGE UPLOAD:**
The user uploaded an image. Focus on:
- Analyzing the visual content thoroughly
- Providing immediate, actionable insights
- Connecting visual observations to game knowledge
`):s.interactionType==="command_centre"&&e.push(`
**@ COMMAND CENTRE:**
The user is using the Command Centre to manage subtabs.
- Execute the requested subtab action precisely
- Confirm what was changed
- Keep the response brief unless the action requires explanation
`),s.isFirstMessage&&e.push(`
**🆕 FIRST INTERACTION IN THIS TAB:**
This is the user's first message in this conversation tab.
- Introduce yourself warmly but briefly
- Orient them to what you can help with for this game
- Be welcoming without being overly verbose
`),s.isReturningUser&&s.timeSinceLastInteraction&&s.timeSinceLastInteraction>60&&e.push(`
**👋 WELCOME BACK:**
The user is returning after a break (${Math.round(s.timeSinceLastInteraction/60)} hours).
- Briefly acknowledge their return (e.g., "Welcome back!")
- Don't repeat what was discussed before unless asked
- Ask if they've made progress since last time
`),e.join(`
`)}function Ut(s,e){const t=[],r=(e==null?void 0:e.messageCount)||s.messages.length,a=s.gameProgress||0,o=(e==null?void 0:e.subtabsFilled)||0,n=(e==null?void 0:e.subtabsTotal)||0;if(s.isGameHub||r<3)return"";if(r>=20?t.push(`
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
`),a>=80?t.push(`
**🏆 LATE GAME (${a}% progress):**
This player is in late/end-game content.
- They've seen most of the game - spoilers are less critical
- Focus on end-game optimization, secret bosses, alternate endings
- Discuss post-game content and NG+ if applicable
`):a>=50&&t.push(`
**⚔️ MID-GAME (${a}% progress):**
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
`)}function Mt(s){if(!s||s.scope==="off")return"";const e=[];if(s.previousTopics.length>0&&e.push(`
**📚 PREVIOUSLY DISCUSSED TOPICS (Avoid Repetition):**
The user has already received information about these topics in recent conversations. 
DO NOT repeat the same information - provide NEW angles, deeper insights, or different aspects.
Topics covered: ${s.previousTopics.slice(0,15).join(", ")}
`),s.corrections.length>0){const t=s.corrections.map(r=>`- ${r.scope==="global"?"(Global)":`(${r.gameTitle||"This Game"})`} Instead of "${r.originalSnippet.slice(0,50)}...", prefer: "${r.correctionText}"`);e.push(`
**✏️ USER CORRECTIONS (Apply these preferences):**
The user has provided the following corrections to improve your responses:
${t.join(`
`)}
`)}return e.join(`
`)}async function Xr(s,e){try{const t=await R.getAIPreferences(s);if(t.responseHistoryScope==="off")return{previousTopics:[],corrections:[],scope:"off"};const[r,a]=await Promise.all([R.getResponseTopics(s,e,t.responseHistoryScope),R.getActiveCorrections(s,e,!0)]);return{previousTopics:r,corrections:a,scope:t.responseHistoryScope}}catch(t){return console.error("[PromptSystem] Error fetching behavior context:",t),null}}const Me=3e3,Lt=2e4,ye=["story_so_far","quest_log","characters","boss_strategy","tips","hidden_secrets","points_of_interest"],We=`
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
`,ge=`
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
`,me=`
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
`,Ie=`
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
`,he=`
**⚠️ CRITICAL: Place game identification tags at the VERY START of your response!**
When responding to a query about a specific game, your response MUST begin with these tags (before any other text):
[OTAKON_GAME_ID: Game Name]
[OTAKON_CONFIDENCE: high|low]
[OTAKON_GENRE: Genre]

This ensures the tags are always captured even if the response is truncated. Do not put them in a code block.

**Tag Definitions:**
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
- [OTAKON_SUBTAB_UPDATE: {"tab": "exact_tab_title", "content": "New content to append"}]: ALWAYS include this when you provide information that should be saved to a subtab. Use the EXACT subtab title you see in "Current Subtabs" section above (e.g., "Sites of Grace Nearby", "Boss Strategy", "Story So Far", etc.). The system will match this to the correct subtab automatically. This ensures subtabs stay updated with the latest information.
- [OTAKON_SUBTAB_CONSOLIDATE: {"tab": "tab_id", "content": "consolidated content"}]: Use when a subtab needs consolidation (prompted by system). Provide a COMPLETE replacement that includes: 1) A "📜 Previous Updates" summary section consolidating old collapsed content, 2) The current/latest content. This REPLACES all subtab content, so make it comprehensive.
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
`,xt=`
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
`,Ft=s=>`
**Persona: General Gaming Assistant**
You are Otagon, a helpful and knowledgeable AI gaming assistant for the "Game Hub" tab.

**CRITICAL - RESPONSE BEHAVIOR:**
- NEVER start responses with self-introductions like "I am Otagon", "Hello! I'm Otagon", "As Otagon", or similar
- NEVER introduce yourself or state your name at the beginning of responses
- Jump directly into answering the user's question with helpful content
- Be conversational but focus on providing value immediately

${We}

${ge}

${me}

${Ie}

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
1. Thoroughly answer the user's query: "${s}".
2. **If the query is about a SPECIFIC RELEASED GAME that the user mentions by name, START your response with these tags:**
   - [OTAKON_GAME_ID: Full Game Name] - The complete, official name of the game
   - [OTAKON_CONFIDENCE: high|low] - Your confidence in the identification
   - [OTAKON_GENRE: Genre] - The primary genre (e.g., Action RPG, FPS, Strategy)
   - [OTAKON_GAME_STATUS: unreleased] - ONLY if the game is NOT YET RELEASED
   **Place these tags at the VERY BEGINNING of your response, before any other text.**
3. At the end, generate three SPECIFIC follow-up prompts using [OTAKON_SUGGESTIONS: ["prompt1", "prompt2", "prompt3"]]
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
✅ User asks: "What can I find in Jig Jig Street?" → Include [OTAKON_GAME_ID: Cyberpunk 2077] [OTAKON_CONFIDENCE: high] (location name identifies game)
✅ User asks: "How do I get the Moonlight Greatsword?" → Detect game from context/item name
✅ User mentions game-specific locations, items, characters, or mechanics → Include game tags
❌ User asks: "What's a good RPG to play?" → NO game tags (general question)
❌ User asks: "Tell me about open world games" → NO game tags (general question)

**CRITICAL: Game Detection from Context**
- If user mentions a location name (e.g., "Jig Jig Street", "Raya Lucaria", "Diamond City"), identify which game it's from
- If user mentions an item name (e.g., "Mantis Blades", "Rivers of Blood", "Pip-Boy"), identify the game
- If user mentions a character or quest name specific to a game, identify that game
- **GAME SWITCHING**: If user is in Game A's tab but asks about Game B's content, include Game B's tags (not Game A's)
  * Example: User in Elden Ring tab asks "What's in Jig Jig Street?" → Include [OTAKON_GAME_ID: Cyberpunk 2077] [OTAKON_CONFIDENCE: high]
  * **IMPORTANT**: Answer the question about Game B - don't say "that's from a different game" or redirect back to Game A
  * The system will automatically switch tabs - your job is to provide helpful information about the detected game
- ALWAYS include game tags when you can identify the game from ANY context clues

**Tag Definitions:**
${he}

**Response Style - GAME HUB (NO HINT SECTION):**
- Be conversational and natural - respond directly to the user's question
- NO structured "Hint:" sections in Game Hub - this is for general gaming discussion
- Use natural paragraphs and flowing prose
- Be helpful and knowledgeable about gaming
- Keep responses concise but informative
- Use gaming terminology appropriately
- Focus on useful information, not obvious descriptions
- Make responses engaging and immersive
- NEVER include underscore lines (___), horizontal rules, or timestamps at the end of responses
- End responses naturally without decorative separators
- Use clean markdown: proper spacing around bold/italic, headings on their own lines
- For lists of games/reviews, use consistent formatting throughout
`,$t=async(s,e,t,r,a)=>{var h;let o=0;const n=[],i=2500,u=[...s.subtabs||[]].filter(d=>d.status==="loaded"&&d.content).sort((d,m)=>{const f=ye.indexOf(d.id),_=ye.indexOf(m.id);return(f===-1?999:f)-(_===-1?999:_)}).map(d=>{const m=d.content||"";m.length>i&&m.includes("<details>")&&n.push(d.id);const f=m.length>Me?m.slice(0,Me)+"...[truncated]":m,_=`### ${d.title} (ID: ${d.id})
${f}`;if(o+_.length>Lt){const I=ye.indexOf(d.id);if(I!==-1&&I<3){const C=`### ${d.title} (ID: ${d.id}) [SUMMARY]
${m.slice(0,500)}...`;return o+=C.length,C}return null}return o+=_.length,_}).filter(Boolean).join(`

`)||"No subtabs available yet.",S=n.length>0?`

**📦 SUBTAB CONSOLIDATION REQUEST:**
The following subtabs have grown large with historical content: ${n.join(", ")}
When updating these subtabs, please CONSOLIDATE older collapsed sections (<details> blocks) into a brief summary.
Instead of keeping multiple old updates, merge them into a single "📜 Previous Updates Summary" that captures key points.
This keeps subtabs useful without losing important context.`:"",T=s.messages.slice(-10).map(d=>`${d.role==="user"?"User":"Otagon"}: ${d.content}`).join(`
`),p=s.contextSummary?`**Historical Context (Previous Sessions):**
${s.contextSummary}

`:"",A=a||j.getDefaultProfile(),Y=j.buildProfileContext(A);let P="";if(s.gameTitle){const d=it.getByGameTitle(s.gameTitle);if(d!=null&&d.igdbGameId)try{const m=await ct.getForContext(d.igdbGameId);m&&(P=`

=== GAME KNOWLEDGE DATABASE ===
The following is comprehensive, up-to-date information about ${s.gameTitle}. You can reference any part of this knowledge base to answer the user's questions accurately.

${m}

=== END KNOWLEDGE DATABASE ===

`,console.log(`🎮 [PromptSystem] Injecting ${m.length} chars of FULL game knowledge (no truncation)`))}catch(m){console.warn("🎮 [PromptSystem] Failed to fetch game knowledge:",m)}}return`
**Persona: Game Companion**
You are Otagon, an immersive AI companion for the game "${s.gameTitle}".
The user's spoiler preference is: "${((h=t.preferences)==null?void 0:h.spoilerPreference)||"none"}".
The user's current session mode is: ${r?"ACTIVE (currently playing)":"PLANNING (not playing)"}.

**CRITICAL - RESPONSE BEHAVIOR:**
- NEVER start responses with self-introductions like "I am Otagon", "Hello! I'm Otagon", "As Otagon", or similar
- NEVER introduce yourself or state your name at the beginning of responses
- Jump directly into answering the user's question with helpful content
- Be conversational but focus on providing value immediately

${We}

${ge}

${me}

${Ie}

**🎮 GAME-SPECIFIC ACCURACY FOR "${s.gameTitle}":**
- ONLY use terminology, locations, and characters that exist in "${s.gameTitle}"
- NEVER mix in content from similar games (e.g., if this is Elden Ring, don't mention "bonfires" or "Firelink Shrine")
- If the user asks about something you're unsure exists in this game, say: "I'm not certain that exists in ${s.gameTitle}. Could you clarify?"
- For specific stats/numbers (damage, health, percentages): Add "approximate" or "check in-game for exact values"

**🧠 USE YOUR TRAINING KNOWLEDGE:**
- You likely know "${s.gameTitle}" well from training - be confident and helpful!
- For strategies, builds, boss fights, collectibles - draw from your built-in knowledge
- Act like a friend who's beaten this game and is helping them through it
- Only mention web search limitations for very recent patches (post-Jan 2025)

**Game Context:**
- Game: ${s.gameTitle} (${s.genre})
- Current Objective: ${s.activeObjective||"Not set"}
- Game Progress: ${s.gameProgress||0}%

**⚠️ CRITICAL: PROGRESS-AWARE RESPONSES**
The player is at **${s.gameProgress||0}% completion**. Tailor ALL responses to their progress:
${s.gameProgress&&s.gameProgress<20?"- EARLY GAME: Player is new. Explain basics, avoid late-game spoilers, suggest beginner-friendly strategies.":""}
${s.gameProgress&&s.gameProgress>=20&&s.gameProgress<50?"- MID-EARLY GAME: Player has basics down. Can discuss intermediate mechanics, warn about upcoming challenges.":""}
${s.gameProgress&&s.gameProgress>=50&&s.gameProgress<75?"- MID-LATE GAME: Player is experienced. Can discuss advanced strategies, reference earlier content they've seen.":""}
${s.gameProgress&&s.gameProgress>=75?"- LATE/END GAME: Player is near completion. Can discuss end-game content, final bosses, post-game secrets.":""}
- NEVER spoil content AHEAD of their current progress (${s.gameProgress||0}%)
- ALWAYS reference content they've ALREADY passed when giving examples
- If they ask about something beyond their progress, warn: "That's later in the game - want me to explain without spoilers?"

**Player Profile:**
${Y}
${P}
**Current Subtabs (Your Knowledge Base):**
${u}
${S}

${p}**Recent Conversation History:**
${T}

**User Query:** "${e}"

**Task:**
1. **CRITICAL - GAME DETECTION OVERRIDE:**
   - **IF the user's query mentions content from a DIFFERENT game** (location, item, character, quest from another game):
     * Include: [OTAKON_GAME_ID: Name of the Detected Game] [OTAKON_CONFIDENCE: high]
     * **ANSWER THE QUESTION about that game** - don't refuse or redirect to current game
     * Provide helpful information about the detected game's content
     * Example: User asks "What's in Jig Jig Street?" → Detect Cyberpunk 2077 → Answer about Jig Jig Street in Cyberpunk
   - **IF the query is about the current game (${s.gameTitle})**:
     * Include [OTAKON_GAME_ID: ${s.gameTitle}] [OTAKON_CONFIDENCE: high] [OTAKON_GENRE: ${s.genre}]
     * Answer using the current game's context

2. **START YOUR RESPONSE WITH CRITICAL TAGS (before any other content):**
   - [OTAKON_GAME_ID: Game Name] - Current game OR detected different game
   - [OTAKON_CONFIDENCE: high]
   - [OTAKON_GENRE: Genre]
   - [OTAKON_PROGRESS: X] - Estimate completion (0-100) based on current context
   - [OTAKON_OBJECTIVE: "description"] - Current main objective

3. Then respond to the user's query in an immersive, in-character way that matches the tone of the game.
4. Use the subtab context above to provide informed, consistent answers.
5. **IMPORTANT: Adapt your response style based on the Player Profile above.**
6. If the query provides new information, update relevant subtabs using [OTAKON_SUBTAB_UPDATE: {"tab": "Exact Tab Title From Above", "content": "new info"}]. Use the EXACT subtab title shown in "Current Subtabs" section.
7. If the query implies progress, identify new objectives using [OTAKON_OBJECTIVE_SET].
8. **PROGRESS ESTIMATION GUIDE:**
   * Current stored progress: ${s.gameProgress||0}%
   * ALWAYS update based on what the player tells you or what you see in screenshots
   * Use these estimates:
     - Tutorial/beginning area → 5
     - First dungeon/boss → 15
     - Exploring early regions → 25
     - Mid-game content → 40
     - Late-game areas → 65
     - Final areas/boss → 85
     - Post-game → 95
   * For Elden Ring specifically:
     - Limgrave → 10, Liurnia → 25, Raya Lucaria Academy → 30
     - Altus Plateau → 45, Leyndell → 55
     - Mountaintops of the Giants → 70, Crumbling Farum Azula → 80
     - Elden Throne → 90
9. ${r?"Provide concise, actionable advice for immediate use.":"Provide more detailed, strategic advice for planning."}
10. At the end, generate three SPECIFIC follow-up prompts using [OTAKON_SUGGESTIONS] - these MUST relate to what you just discussed, not generic questions.

**CRITICAL - Context-Aware Follow-ups:**
- Your suggestions MUST reference specific content from YOUR response (bosses, items, locations, characters you mentioned)
- ❌ BAD: "What should I do next?" (too generic)
- ✅ GOOD: "How do I counter [specific enemy you mentioned]'s attack pattern?"
- ✅ GOOD: "Where can I find the [specific item you referenced]?"
- The user is ${r?"actively playing - suggest immediate tactical questions":"planning - suggest strategic/preparation questions"}

${xt}

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
${he}

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

**Response Format - DYNAMIC HEADERS WITH HINT FIRST:**
For this query "${e}", use structured sections with bold headers:

1. **ALWAYS start with "Hint:" section** - This is MANDATORY for all game-specific queries (text, image, or both)
   - Provide immediate, actionable guidance
   - Keep it concise and practical
   - This is the ONLY section read aloud by TTS

2. **Add 1-2 additional contextual sections** based on query type:
   - **Boss fights**: Add "Weak Points:", "Phase Guide:", or "Strategy:"
   - **Exploration**: Add "Hidden Areas:", "Secrets Nearby:", or "Places of Interest:"
   - **Story questions**: Add "Story Context:", "Character Info:", or "Lore:"
   - **Item locations**: Add "How to Get There:", "What You Need:"
   - **Character info**: Add "Character Background:", "Role in Story:"
   - **Build advice**: Add "Key Stats:", "Gear & Upgrades:"
   - **General help**: Add "Lore:", "Places of Interest:", or other relevant sections

**CRITICAL FORMATTING RULES:**
- Bold headers must be on same line: "**Hint:**" NOT "**Hint:
**"
- No spaces after opening **: "**Hint:**" NOT "** Hint:**"
- Always close bold markers properly
- Vary the 2nd/3rd sections based on query context to prevent repetition

**Response Style:**
- Match the tone and atmosphere of ${s.gameTitle}
- Be spoiler-free beyond current progress
- Provide practical, actionable advice in Hint section
- Use game-specific terminology and references
- Include lore and story context appropriate to player's progress
- When updating subtabs, seamlessly integrate the update into your response
- Use clean, consistent markdown formatting throughout
`},Wt=(s,e,t,r)=>{const a=r||j.getDefaultProfile(),o=j.buildProfileContext(a),n=s.messages.slice(-10).map(i=>`${i.role==="user"?"User":"Otagon"}: ${i.content}`).join(`
`);return`
**Persona: Pre-Release Game Companion**
You are Otagon, an AI companion helping users explore and discuss **${s.gameTitle}** - an UNRELEASED/UPCOMING game.

${ge}

${me}

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
- Game: ${s.gameTitle} (${s.genre||"Unknown Genre"})
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

**Response Style - UNRELEASED GAMES (NO HINT SECTION):**
- Be conversational and natural - no structured "Hint:" sections for unreleased games
- Use natural paragraphs and flowing prose
- Be enthusiastic but accurate about pre-release content
- Share excitement while maintaining factual grounding
- Recommend ways to prepare (play previous games, check system requirements)
- Keep users informed about latest news and updates
- Use clean, consistent markdown formatting
- Focus on confirmed information, speculation, and preparation advice

**Tag Definitions:**
${he}
`},Bt=(s,e,t,r)=>{const a=r||j.getDefaultProfile(),o=j.buildProfileContext(a),n=s.gameTitle?`
**📊 CURRENT PLAYER PROGRESS:**
- Game: ${s.gameTitle}
- Progress: ${s.gameProgress||0}%
- Current Objective: ${s.activeObjective||"Not set"}
${s.gameProgress&&s.gameProgress<20?"- Player is EARLY GAME - explain basics, avoid spoilers ahead of their progress":""}
${s.gameProgress&&s.gameProgress>=20&&s.gameProgress<50?"- Player is MID-EARLY GAME - can reference earlier content they've seen":""}
${s.gameProgress&&s.gameProgress>=50&&s.gameProgress<75?"- Player is MID-LATE GAME - can discuss advanced strategies":""}
${s.gameProgress&&s.gameProgress>=75?"- Player is LATE GAME - can discuss end-game content":""}
`:"";return`
**Persona: Game Lore Expert & Screenshot Analyst**
You are Otagon, an expert at analyzing game visuals and providing immersive, lore-rich assistance.

${ge}

${me}

${Ie}

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
2. **CRITICAL TAG REQUIREMENTS - Include ALL of these tags AT THE VERY START OF YOUR RESPONSE (before any other content):**
   - [OTAKON_GAME_ID: Full Game Name] - The complete, official name of the game
   - [OTAKON_CONFIDENCE: high|low] - Your confidence in the identification
   - [OTAKON_GENRE: Genre] - The primary genre (e.g., Action RPG, FPS, Strategy)
   - [OTAKON_IS_FULLSCREEN: true|false] - Is this fullscreen gameplay? (For informational purposes)
   - [OTAKON_GAME_STATUS: unreleased] - ONLY include this if the game is NOT YET RELEASED (verify release date!)
   - **[OTAKON_PROGRESS: XX]** - ⚠️ MANDATORY: Estimate player's game completion percentage (0-100)
   - [OTAKON_OBJECTIVE: "current goal"] - What the player appears to be doing
3. Answer: "${e}" with focus on game lore, significance, and useful context
4. At the end, provide 3 contextual suggestions using [OTAKON_SUGGESTIONS: ["suggestion1", "suggestion2", "suggestion3"]]

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

**Response Format - DYNAMIC HEADERS WITH HINT ALWAYS FIRST:**

For the query: "${e}"

**MANDATORY STRUCTURE:**
1. **ALWAYS start with "Hint:" section** - This is REQUIRED for all game-specific screenshots
   - Provide immediate, actionable guidance about what the player should do
   - This is the ONLY section read aloud by TTS
   - Keep it concise and practical

2. **Add 1-2 additional contextual sections** based on what the screenshot shows and the query asks:
   - **Boss fights**: Add "Weak Points:", "Phase Guide:", or "Combat Strategy:"
   - **Exploration/Navigation**: Add "Hidden Areas:", "Secrets Nearby:", or "Places of Interest:"
   - **Story scenes**: Add "Story Context:", "Character Info:", or "Lore:"
   - **Item locations**: Add "How to Get There:", "What You Need:"
   - **Character interactions**: Add "Character Background:", "Dialogue Options:"
   - **Build/Stats screens**: Add "Build Recommendation:", "Key Stats:"
   - **General gameplay**: Add "Lore:", "What This Means:", or other relevant sections

**CRITICAL FORMATTING RULES:**
1. **First section MUST be "Hint:"** - no exceptions for game screenshots
2. Bold text must be on SAME LINE: "**Hint:**" NOT "**Hint:
**"
3. NO spaces after opening **: "**Hint:**" NOT "** Hint:**"
4. NO spaces before closing **: "**Lore:**" NOT "**Lore: **"
5. Always close bold markers properly
6. Vary the 2nd/3rd sections to prevent repetition - adapt to query context

**🚨 DO NOT - COMMON MISTAKES:**
❌ WRONG: "** Hint:**" (space after **)
❌ WRONG: "**Hint:
**" (newline inside bold)
❌ WRONG: Not starting with Hint section
❌ WRONG: Using same "Hint/Lore/Places" every time - vary based on context
✅ CORRECT: Always start with "**Hint:**" then add contextual sections

**What to focus on:**
- Immediate actionable guidance in Hint section
- Story significance and lore implications
- Character relationships and motivations
- Location importance and world-building
- Gameplay mechanics and strategic advice
- Narrative context and plot relevance

**What to avoid:**
- Describing obvious UI elements (health bars, buttons, etc.)
- Stating the obvious ("you can see buildings")
- Generic descriptions that don't add value
- Repetitive section headers - adapt to query type

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

**OUTPUT FORMAT (include at VERY START of response, before your main content):**
[OTAKON_GAME_ID: Game Name]
[OTAKON_CONFIDENCE: high|low]
[OTAKON_GENRE: Genre]
[OTAKON_PROGRESS: XX]
[OTAKON_OBJECTIVE: "What player is currently doing"]

**If you cannot determine exact progress, estimate based on visual complexity - NEVER leave progress at 0 if you can see gameplay.**

**CRITICAL - Subtab Updates (Include when providing valuable info):**
- Use **[OTAKON_SUBTAB_UPDATE: {"tab": "Exact Tab Title", "content": "content"}]** to save important info to subtabs
- Use the EXACT subtab titles shown in the screenshot analysis above (look for "### [Title]" in subtab context)
- For game-specific tabs like "Sites of Grace Nearby", "Cyberware Build", use those exact titles
- Example for Elden Ring: [OTAKON_SUBTAB_UPDATE: {"tab": "Sites of Grace Nearby", "content": "**Stormveil Castle**: Main Gate grace found..."}]
- Example for generic: [OTAKON_SUBTAB_UPDATE: {"tab": "Boss Strategy", "content": "**Boss Name**: Attack patterns include..."}]

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
${he}
`},Qr=async(s,e,t,r,a,o,n,i,c)=>{const u=n?Mt(n):"",S=i?`
**User Timezone:** ${i}
When discussing game release dates, provide times in the user's local timezone. For upcoming releases, be specific about exact date and time if known.
`:"",T=c?Dt(c):"",p=Ut(s,c);let A;a?A=Bt(s,e,t,o):!s.isGameHub&&s.gameTitle?s.isUnreleased?A=Wt(s,e,t,o):A=await $t(s,e,t,r,o):A=Ft(e);const Y=[u,S,T,p].filter(Boolean).join(`
`);return Y?Y+`

`+A:A};class Ht{constructor(){E(this,"retryAttempts",new Map);E(this,"MAX_RETRIES",3);E(this,"RETRY_DELAYS",[1e3,2e3,4e3])}async handleAIError(e,t){if(console.error(`🤖 [ErrorRecovery] AI Error in ${t.operation}:`,e),console.error("🤖 [ErrorRecovery] Error message:",e.message),e.message.includes("RATE_LIMIT_ERROR")||e.message.includes("rate limit")||e.message.includes("quota")||e.message.includes("429")||e.message.includes("RESOURCE_EXHAUSTED")||e.message.includes("Too Many Requests"))return console.error("🔴 [ErrorRecovery] ⛔ RATE LIMIT ERROR DETECTED - STOPPING ALL RETRIES"),console.error("🔴 [ErrorRecovery] Error message:",e.message),{type:"user_notification",message:"AI service is temporarily busy. Please wait about a minute and try again."};if(e.message.includes("API key")||e.message.includes("authentication")||e.message.includes("401")||e.message.includes("403")||e.message.includes("unauthorized"))return console.error("🔴 [ErrorRecovery] Auth error - NOT retrying:",e.message),{type:"user_notification",message:"AI service authentication failed. Please try logging out and back in."};if(this.shouldRetry(t)){const a=this.getRetryDelay(t.retryCount);return console.log(`🔄 [ErrorRecovery] Will retry after ${a}ms (attempt ${t.retryCount+1}/${this.MAX_RETRIES})`),await this.delay(a),{type:"retry",action:async()=>{}}}return e.message.includes("network")||e.message.includes("timeout")?{type:"user_notification",message:"Network connection issue. Please check your internet connection and try again."}:(console.error("🔴 [ErrorRecovery] Unknown AI service error:",{message:e.message,stack:e.stack,operation:t.operation}),{type:"user_notification",message:"AI service is temporarily unavailable. Please try again later."})}async handleConversationError(e,t){return console.error(`💬 [ErrorRecovery] Conversation Error in ${t.operation}:`,e),e.message.includes("not found")?{type:"fallback",message:"Conversation not found. Creating a new one.",action:async()=>{}}:e.message.includes("permission")||e.message.includes("unauthorized")?{type:"user_notification",message:"Permission denied. Please log in again."}:{type:"user_notification",message:"Failed to save conversation. Your data may not be persisted."}}async handleCacheError(e,t){return console.error(`💾 [ErrorRecovery] Cache Error in ${t.operation}:`,e),{type:"skip",message:"Cache unavailable. Continuing without caching."}}async handleWebSocketError(e,t){if(console.error(`🔌 [ErrorRecovery] WebSocket Error in ${t.operation}:`,e),this.shouldRetry(t)){const r=this.getRetryDelay(t.retryCount);return{type:"retry",action:async()=>{await this.delay(r)}}}return{type:"user_notification",message:"PC connection lost. Screenshot upload may not be available."}}shouldRetry(e){const t=`${e.operation}_${e.conversationId||"global"}`;return(this.retryAttempts.get(t)||0)<this.MAX_RETRIES}getRetryDelay(e){return this.RETRY_DELAYS[Math.min(e,this.RETRY_DELAYS.length-1)]}getRetryCount(e){const t=`${e.operation}_${e.conversationId||"global"}`;return this.retryAttempts.get(t)||0}incrementRetryCount(e){const t=`${e.operation}_${e.conversationId||"global"}`,r=this.retryAttempts.get(t)||0;this.retryAttempts.set(t,r+1)}resetRetryCount(e){const t=`${e.operation}_${e.conversationId||"global"}`;this.retryAttempts.delete(t)}delay(e){return new Promise(t=>setTimeout(t,e))}displayError(e,t="error"){console.log(`[${t.toUpperCase()}] ${e}`),t==="error"&&console.error("User Error:",e)}logError(e,t,r){console.error("Error Details:",{error:e.message,stack:e.stack,context:t,additionalInfo:r,timestamp:new Date().toISOString()})}}const Zr=new Ht;class Kt{constructor(){E(this,"gameTones",{"Action RPG":{adjectives:["epic","heroic","legendary","mystical","ancient"],personality:"wise and experienced adventurer",speechPattern:"speaks with the wisdom of ages and the thrill of adventure",loreStyle:"rich with mythology and ancient secrets"},FPS:{adjectives:["intense","tactical","precise","combat-ready","strategic"],personality:"battle-hardened soldier",speechPattern:"communicates with military precision and combat experience",loreStyle:"focused on warfare, technology, and military history"},Horror:{adjectives:["ominous","chilling","mysterious","haunting","eerie"],personality:"knowledgeable survivor",speechPattern:"speaks with caution and awareness of lurking dangers",loreStyle:"dark and atmospheric, filled with supernatural elements"},Puzzle:{adjectives:["logical","methodical","analytical","clever","systematic"],personality:"brilliant problem-solver",speechPattern:"explains with clear logic and step-by-step reasoning",loreStyle:"intellectual and mysterious, focused on patterns and solutions"},RPG:{adjectives:["immersive","narrative-driven","character-focused","epic","emotional"],personality:"storyteller and guide",speechPattern:"speaks like a narrator, weaving tales and character development",loreStyle:"deep character development and rich storytelling"},Strategy:{adjectives:["tactical","strategic","calculated","methodical","commanding"],personality:"master tactician",speechPattern:"speaks with authority and strategic insight",loreStyle:"focused on warfare, politics, and grand strategy"},Adventure:{adjectives:["exploratory","curious","adventurous","discoverer","wanderer"],personality:"intrepid explorer",speechPattern:"speaks with wonder and excitement about discovery",loreStyle:"filled with exploration, discovery, and world-building"},Default:{adjectives:["helpful","knowledgeable","friendly","supportive","engaging"],personality:"helpful gaming companion",speechPattern:"speaks clearly and helpfully",loreStyle:"focused on gameplay and helpful information"}})}getGameTone(e){return this.gameTones[e]||this.gameTones.Default}generateImmersionContext(e){const t=this.getGameTone(e.genre);let r=`**Immersion Context for ${e.gameTitle}:**
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

${e}`),r}getGenreSuggestions(e,t){const r=["Tell me more about this area","What should I do next?","Any tips for this situation?"];return{"Action RPG":["What's the lore behind this location?","How do I improve my character?","What quests are available here?","Tell me about the local NPCs"],FPS:["What's the best tactical approach?","What weapons work best here?","How do I flank the enemy?","What's the mission objective?"],Horror:["What's the history of this place?","How do I survive this area?","What should I be careful of?","Tell me about the local legends"],Puzzle:["What's the pattern here?","How do I solve this step by step?","What clues am I missing?","What's the logical approach?"],RPG:["Tell me about the story so far","What choices should I make?","How do I develop my character?","What's the significance of this moment?"],Strategy:["What's the best strategy here?","How do I manage my resources?","What's the optimal build order?","How do I counter this threat?"]}[e]||r}createImmersiveSubTabContent(e,t,r){var o,n;const a={walkthrough:{"Action RPG":`# ${t} - Walkthrough

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
*Master the game...*`}};return((o=a[e])==null?void 0:o[r])||((n=a[e])==null?void 0:n.Default)||`# ${t} - ${e}

*Content loading...*`}}const es=new Kt,Yt=`You are a correction validator for OTAKON, an AI gaming companion.
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
}`,qt=(s,e,t)=>`
Validate this correction:

ORIGINAL AI RESPONSE (snippet):
"${s.slice(0,500)}"

USER'S CORRECTION:
"${e}"

GAME CONTEXT: ${t||"General gaming / Game Hub"}

Is this correction valid? Respond with JSON only.`,we="otakon_correction_submissions",Q=3;function Be(){try{const s=localStorage.getItem(we),e=Date.now();if(!s)return{allowed:!0,remaining:Q};const t=JSON.parse(s);if(e>t.resetAt)return{allowed:!0,remaining:Q};const r=Q-t.count;return{allowed:r>0,remaining:Math.max(0,r)}}catch{return{allowed:!0,remaining:Q}}}function Vt(){try{const s=localStorage.getItem(we),e=Date.now(),t=1440*60*1e3;let r={count:0,resetAt:e+t};s&&(r=JSON.parse(s),e>r.resetAt&&(r={count:0,resetAt:e+t})),r.count++,localStorage.setItem(we,JSON.stringify(r))}catch{}}async function He(s,e,t){if(!e.trim())return{isValid:!1,reason:"Correction text is empty"};if(e.length<5)return{isValid:!1,reason:"Correction is too short"};if(e.length>1e3)return{isValid:!1,reason:"Correction is too long (max 1000 characters)"};const r=[/\b(hate|kill|die|attack)\s+(all|every|those)\b/i,/\b(racial|ethnic)\s+slur/i,/\bviolence\s+against\b/i];for(const a of r)if(a.test(e))return{isValid:!1,reason:"Correction contains inappropriate content"};try{const{data:a,error:o}=await l.functions.invoke("gemini-chat",{body:{messages:[{role:"system",content:Yt},{role:"user",content:qt(s,e,t)}],model:"gemini-2.0-flash",temperature:.1,maxTokens:200}});if(o)return console.error("[CorrectionService] Validation API error:",o),{isValid:!1,reason:"Validation service temporarily unavailable. Please try again later."};const n=(a==null?void 0:a.content)||(a==null?void 0:a.response)||"",i=n.match(/\{[\s\S]*\}/);if(i){const c=JSON.parse(i[0]);return{isValid:c.isValid===!0,reason:c.reason||"Validation complete",suggestedType:c.suggestedType||void 0}}return console.warn("[CorrectionService] Could not parse validation response:",n),{isValid:!1,reason:"Validation response was unclear. Please try again."}}catch(a){return console.error("[CorrectionService] Validation exception:",a),{isValid:!1,reason:"Validation failed. Please try again later."}}}async function zt(s,e){if(!Be().allowed)return{success:!1,error:`Daily correction limit reached (${Q}/day). Try again tomorrow.`};const r=await He(e.originalResponse,e.correctionText,e.gameTitle),{error:a}=await l.from("ai_feedback").insert({user_id:s,conversation_id:e.conversationId,message_id:e.messageId,feedback_type:"down",content_type:"message",category:"correction",comment:e.originalResponse.slice(0,500),correction_text:e.correctionText,correction_type:e.type,correction_scope:e.scope,is_validated:r.isValid,validation_reason:r.reason,game_title:e.gameTitle});if(a)return console.error("[CorrectionService] Failed to store feedback:",a),{success:!1,error:"Failed to save correction"};if(!r.isValid)return{success:!1,error:r.reason};const o=await R.addCorrection(s,{gameTitle:e.gameTitle,originalSnippet:e.originalResponse.slice(0,200),correctionText:e.correctionText,type:r.suggestedType||e.type,scope:e.scope});return o.success?(Vt(),{success:!0,correction:(await R.getActiveCorrections(s,e.gameTitle)).find(c=>c.correctionText===e.correctionText)}):{success:!1,error:o.error}}const jt=[/\b(boss(?:es)?|mini-boss|final boss)\b/gi,/\b(enemy types?|elite enemies|common enemies)\b/gi,/\b(legendary weapon|rare item|unique gear)\b/gi,/\b(skill tree|ability points?|talent build)\b/gi,/\b(main quest|side quest|daily quest)\b/gi,/\b(damage build|tank build|support build|dps build)\b/gi,/\b(speedrun(?:ning)?|world record|personal best)\b/gi,/\b(secret area|hidden path|easter egg)\b/gi,/\b(tier list|meta build|optimal strategy)\b/gi,/\b(patch notes?|balance changes?|nerf(?:ed)?|buff(?:ed)?)\b/gi,/\b(dlc|expansion pack|season pass)\b/gi,/\b(game mechanics?|combat system|progression system)\b/gi,/\b(character build|loadout guide|equipment guide)\b/gi],Jt=/\b([A-Z][a-z]{2,}(?:\s+(?:of|the|and)\s+)?[A-Z][a-z]{2,}(?:\s+[A-Z][a-z]+)?)\b/g;function Xt(s){if(!s||s.length<100)return[];const e=new Set;for(const n of jt){const i=s.match(n);if(i)for(const c of i){const u=c.toLowerCase().trim();u.length>=6&&u.length<=50&&u.includes(" ")&&e.add(u)}}let t=0;const r=s.match(Jt);if(r)for(const n of r){if(t>=5)break;const i=n.toLowerCase().trim();i.length>=6&&i.length<=40&&(e.add(i),t++)}const a=/\b(chapter|level|stage|floor|wave|round|phase|part|episode|act)\s+(\d+)\b/gi;let o;for(;(o=a.exec(s))!==null;)e.add(`${o[1].toLowerCase()} ${o[2]}`);return Array.from(e).slice(0,10)}async function Qt(s){return(await R.getBehaviorData(s)).aiCorrections}async function Zt(s,e){return R.getActiveCorrections(s,e,!0)}function er(){return Be()}const F={validateCorrection:He,submitCorrection:zt,getAllCorrections:Qt,getContextualCorrections:Zt,getRateLimitStatus:er,extractTopicsFromResponse:Xt,toggleCorrection:R.toggleCorrection,removeCorrection:R.removeCorrection},pe={free:0,pro:30,vanguard_pro:100},_e=new Set(["fortnite","apex legends","warzone","call of duty warzone","pubg","playerunknown's battlegrounds","league of legends","lol","dota 2","dota","smite","heroes of the storm","overwatch","overwatch 2","valorant","rainbow six siege","r6","paladins","world of warcraft","wow","final fantasy xiv","ffxiv","ff14","guild wars 2","gw2","elder scrolls online","eso","destiny 2","destiny","warframe","lost ark","new world","diablo 4","diablo iv","path of exile","poe","genshin impact","honkai star rail","zenless zone zero","zzz","wuthering waves","tower of fantasy","fifa","ea fc","fc 24","fc 25","madden","nba 2k","2k24","2k25","hearthstone","marvel snap","legends of runeterra","lor","magic arena","mtg arena","street fighter 6","sf6","tekken 8","mortal kombat 1","mk1","guilty gear strive","the finals","xdefiant","helldivers 2","sea of thieves","no man's sky","fall guys","rocket league","dead by daylight","dbd"]),Ae=new Set(["gta 6","grand theft auto 6","grand theft auto vi","monster hunter wilds","death stranding 2","death stranding 2: on the beach","ghost of yotei","like a dragon: pirate yakuza in hawaii","kingdom come deliverance 2","kingdom come 2","avowed","civilization 7","civ 7","civilization vii","fable","assassin's creed shadows","split fiction","doom: the dark ages","borderlands 4","mafia: the old country","marvel 1943","judge 0"]),Ke=new Date("2025-01-31T23:59:59Z").getTime();function Ye(s){return s?s*1e3>Ke:!1}function Oe(s){if(!s)return!1;const e=s.toLowerCase().trim();return _e.has(e)||Array.from(_e).some(t=>e.includes(t))}function ve(s){if(!s)return!1;const e=s.toLowerCase().trim();return Ae.has(e)||Array.from(Ae).some(t=>e.includes(t))}function qe(s,e,t){const r=s.toLowerCase();if(Ye(t))return console.log("🔍 [GroundingControl] Game detected as post-cutoff via IGDB release date"),"post_cutoff_game";if(ve(e)||ve(s))return"post_cutoff_game";const a=Oe(e)||Oe(s);return a&&(r.includes("meta")||r.includes("tier list")||r.includes("best")||r.includes("current")||r.includes("viable")||r.includes("nerf")||r.includes("buff")||r.includes("season")||r.includes("ranked")||r.includes("competitive")||r.includes("patch"))?"live_service_meta":r.includes("latest news")||r.includes("recent news")||r.includes("gaming news")||r.includes("announced today")||r.includes("announced this week")||r.includes("just announced")||r.includes("breaking news")||r.includes("new announcement")?"current_news":r.includes("patch notes")||r.includes("latest patch")||r.includes("recent update")||r.includes("new update")||r.includes("hotfix")||r.includes("balance change")||r.includes("what changed")||r.includes("patch")&&(r.includes("today")||r.includes("latest")||r.includes("new"))?"patch_notes":r.includes("release")&&r.includes("date")||r.includes("when does")||r.includes("when is")||r.includes("coming out")||r.includes("launch date")||r.includes("coming soon")||r.includes("2025")||r.includes("2026")?"release_dates":!a&&(r.includes("how do i")||r.includes("how to")||r.includes("help me")||r.includes("stuck on")||r.includes("boss")||r.includes("strategy")||r.includes("build")||r.includes("tips")||r.includes("guide")||r.includes("walkthrough")||r.includes("where is")||r.includes("where can i")||r.includes("best way to")||r.includes("how do you")||r.includes("explain"))?"game_help":"general_knowledge"}function Ve(s,e,t){const r=pe[e];return t>=r?{useGrounding:!1,reason:`Monthly grounding limit reached (${t}/${r}). AI will use training knowledge.`}:s==="post_cutoff_game"?{useGrounding:!0,reason:"Game released after AI knowledge cutoff (Jan 2025) - web search required"}:s==="live_service_meta"?e==="free"&&t>=4?{useGrounding:!1,reason:"Free tier live service meta limited - upgrade for more current data"}:{useGrounding:!0,reason:"Live service game - current meta/patch info requires web search"}:s==="current_news"?{useGrounding:!0,reason:"Current news query requires web search"}:s==="patch_notes"?{useGrounding:!0,reason:"Recent patch notes require web search"}:s==="release_dates"?{useGrounding:!0,reason:"Release date verification via web search"}:s==="game_help"?{useGrounding:!1,reason:"Known game - AI has comprehensive training knowledge"}:s==="general_knowledge"?{useGrounding:!1,reason:"General gaming knowledge - AI can answer from training"}:{useGrounding:!1,reason:"Default: use AI knowledge"}}const te=new Map,tr=300*1e3;let V=null;function ze(){const s=new Date;return`${s.getFullYear()}-${String(s.getMonth()+1).padStart(2,"0")}`}async function Ne(s){var r,a;const e=ze(),t=te.get(s);if(t&&t.month===e&&Date.now()-t.lastSync<tr)return t.count;if(V===!1)return(t==null?void 0:t.count)||0;try{const{data:o,error:n}=await l.from("user_grounding_usage").select("usage_count").eq("auth_user_id",s).eq("month_year",e).maybeSingle();if(n)return n.code==="42P01"||n.code==="PGRST205"||(r=n.message)!=null&&r.includes("does not exist")||(a=n.message)!=null&&a.includes("Could not find")?(console.warn("[GroundingControl] DB table not yet created, using in-memory tracking"),V=!1,(t==null?void 0:t.count)||0):(console.error("[GroundingControl] Failed to fetch usage:",n),(t==null?void 0:t.count)||0);V=!0;const i=(o==null?void 0:o.usage_count)||0;return te.set(s,{count:i,month:e,lastSync:Date.now()}),i}catch(o){return console.error("[GroundingControl] Error fetching usage:",o),(t==null?void 0:t.count)||0}}async function rr(s){var r,a;const e=ze(),t=te.get(s);if(t&&t.month===e?(t.count++,t.lastSync=Date.now()):te.set(s,{count:1,month:e,lastSync:Date.now()}),V===!1){console.log(`🔍 [GroundingControl] Incremented usage (in-memory) for ${s} (month: ${e})`);return}try{const{error:o}=await l.from("user_grounding_usage").upsert({auth_user_id:s,month_year:e,usage_count:((r=te.get(s))==null?void 0:r.count)||1,updated_at:new Date().toISOString()},{onConflict:"auth_user_id,month_year"});if(o){if(o.code==="42P01"||(a=o.message)!=null&&a.includes("does not exist")){console.warn("[GroundingControl] DB table not yet created, using in-memory tracking"),V=!1;return}await l.rpc("increment_grounding_usage",{p_auth_user_id:s,p_month_year:e})}V=!0,console.log(`🔍 [GroundingControl] Incremented usage for ${s} (month: ${e})`)}catch(o){console.error("[GroundingControl] Failed to increment usage:",o)}}async function sr(s,e){const t=await Ne(s),r=pe[e];return Math.max(0,r-t)}async function ar(s,e,t,r,a){const o=qe(t,r,a),n=await Ne(s),i=pe[e],c=Math.max(0,i-n),{useGrounding:u,reason:S}=Ve(o,e,n);return console.log("🔍 [GroundingControl] Check result:",{tier:e,queryType:o,useGrounding:u,reason:S,usage:`${n}/${i}`,remainingQuota:c,igdbReleaseDate:a?new Date(a*1e3).toISOString():"N/A"}),{useGrounding:u,queryType:o,reason:S,remainingQuota:c}}const ts={classifyQuery:qe,shouldUseGrounding:Ve,getGroundingUsage:Ne,incrementGroundingUsage:rr,getRemainingQuota:sr,checkGroundingEligibility:ar,isLiveServiceGame:Oe,isPostCutoffGame:ve,isRecentRelease:Ye,GROUNDING_LIMITS:pe,LIVE_SERVICE_GAMES:_e,POST_CUTOFF_GAMES:Ae,KNOWLEDGE_CUTOFF_TIMESTAMP:Ke},or={light:10,medium:20,heavy:40,success:[10,50,10],error:[50,100,50],warning:[20,50,20,50,20],buttonPress:15,modalOpen:[10,30,10],modalClose:10,tabSwitch:12,messageSend:[10,40,15],swipe:8,longPress:[0,50,30],notification:[20,100,20,100,30]};function je(){return typeof navigator<"u"&&"vibrate"in navigator&&typeof navigator.vibrate=="function"}function Je(){return lt()&&je()}function w(s){var e;if(!Je())return!1;try{const t=or[s];return(e=navigator.vibrate)==null||e.call(navigator,t),!0}catch(t){return console.warn("[Haptic] Failed to trigger haptic feedback:",t),!1}}function nr(){var s;je()&&((s=navigator.vibrate)==null||s.call(navigator,0))}const rs={light:()=>w("light"),medium:()=>w("medium"),heavy:()=>w("heavy"),success:()=>w("success"),error:()=>w("error"),warning:()=>w("warning"),button:()=>w("buttonPress"),modalOpen:()=>w("modalOpen"),modalClose:()=>w("modalClose"),tabSwitch:()=>w("tabSwitch"),messageSend:()=>w("messageSend"),swipe:()=>w("swipe"),longPress:()=>w("longPress"),notification:()=>w("notification"),stop:nr,isAvailable:Je};class ir{constructor(){E(this,"STORAGE_KEY","otakon_used_suggested_prompts");E(this,"LAST_RESET_KEY","otakon_suggested_prompts_last_reset");E(this,"RESET_INTERVAL_MS",1440*60*1e3);E(this,"usedPrompts",new Set);this.loadUsedPrompts(),this.checkAndResetIfNeeded()}loadUsedPrompts(){try{const e=localStorage.getItem(this.STORAGE_KEY);if(e){const t=JSON.parse(e);this.usedPrompts=new Set(t)}}catch{this.usedPrompts=new Set}}saveUsedPrompts(){try{const e=Array.from(this.usedPrompts);localStorage.setItem(this.STORAGE_KEY,JSON.stringify(e))}catch{}}checkAndResetIfNeeded(){try{const e=localStorage.getItem(this.LAST_RESET_KEY),t=Date.now();(!e||t-parseInt(e)>=this.RESET_INTERVAL_MS)&&(this.resetUsedPrompts(),localStorage.setItem(this.LAST_RESET_KEY,t.toString()))}catch{}}markPromptAsUsed(e){this.usedPrompts.add(e),this.saveUsedPrompts()}isPromptUsed(e){return this.usedPrompts.has(e)}getUnusedPrompts(e){return e.filter(t=>!this.isPromptUsed(t))}areAllPromptsUsed(e){return e.every(t=>this.isPromptUsed(t))}resetUsedPrompts(){this.usedPrompts.clear(),localStorage.removeItem(this.STORAGE_KEY)}getUsedCount(){return this.usedPrompts.size}getTimeUntilNextReset(){try{const e=localStorage.getItem(this.LAST_RESET_KEY);if(!e)return 0;const t=parseInt(e)+this.RESET_INTERVAL_MS;return Math.max(0,t-Date.now())}catch{return 0}}getStaticNewsPrompts(){return ut}processAISuggestions(e){if(console.log("🔧 [SuggestedPromptsService] processAISuggestions INPUT:",e),console.log("🔧 [SuggestedPromptsService] INPUT type:",typeof e),console.log("🔧 [SuggestedPromptsService] INPUT is Array:",Array.isArray(e)),!e)return console.log("🔧 [SuggestedPromptsService] No suggestions - returning []"),[];let t=[];if(Array.isArray(e))t=e;else if(typeof e=="string"){let a=e.trim();a.startsWith('["')&&!a.endsWith('"]')&&(a.endsWith('"')||(a+='"'),a.endsWith("]")||(a+="]"));try{const o=JSON.parse(a);Array.isArray(o)?t=o:t=[e]}catch{a.includes('", "')||a.includes(`",
"`)?t=a.split(/",\s*"/).map(n=>n.replace(/^["\s]+|["\s]+$/g,"")).filter(n=>n.length>0):a.includes(`
`)?t=a.split(`
`).map(n=>n.replace(/^["\s]+|["\s]+$/g,"")).filter(n=>n.length>0):t=[e]}}const r=t.filter(a=>a&&typeof a=="string"&&a.trim().length>0).map(a=>a.trim()).slice(0,3);return console.log("🔧 [SuggestedPromptsService] suggestionsArray before filter:",t),console.log("🔧 [SuggestedPromptsService] RESULT after filter/map/slice:",r),console.log("🔧 [SuggestedPromptsService] RESULT length:",r.length),r}getFallbackSuggestions(e,t){return t===!0||e==="game-hub"||e==="everything-else"?this.getStaticNewsPrompts():["What should I do next in this area?","Tell me about the story so far","Give me some tips for this game","What are the key mechanics I should know?"]}}const ss=new ir,re=new Map,cr=300*1e3;function lr(s,e,t){return`${s}:${e}:${t||"global"}`}function ur(s){const e=re.get(s);return e?Date.now()-e.timestamp>cr?(re.delete(s),null):e.prompts:null}function dr(s,e){re.set(s,{prompts:e,timestamp:Date.now()})}function Xe(s){for(const e of re.keys())e.startsWith(s)&&re.delete(e)}async function Re(s,e,t=null,r=20){const a=lr(s,e,t),o=ur(a);if(o)return o;try{const n=new Date;n.setDate(n.getDate()-7);let i=l.from("ai_shown_prompts").select("prompt_text").eq("auth_user_id",s).eq("prompt_type",e).gte("shown_at",n.toISOString()).order("shown_at",{ascending:!1}).limit(r);t&&(i=i.or(`game_title.eq.${t},game_title.is.null`));const{data:c,error:u}=await i;if(u)return console.error("[ShownPromptsService] Error fetching prompts:",u),[];const S=(c||[]).map(T=>T.prompt_text);return dr(a,S),S}catch(n){return console.error("[ShownPromptsService] Exception fetching prompts:",n),[]}}async function gr(s,e){try{const{error:t}=await l.from("ai_shown_prompts").insert({auth_user_id:s,prompt_text:e.promptText,prompt_type:e.promptType,game_title:e.gameTitle||null,conversation_id:e.conversationId||null});return t?(console.error("[ShownPromptsService] Error recording prompt:",t),!1):(Xe(s),!0)}catch(t){return console.error("[ShownPromptsService] Exception recording prompt:",t),!1}}async function mr(s,e){if(!e.length)return!0;try{const t=e.map(a=>({auth_user_id:s,prompt_text:a.promptText,prompt_type:a.promptType,game_title:a.gameTitle||null,conversation_id:a.conversationId||null})),{error:r}=await l.from("ai_shown_prompts").insert(t);return r?(console.error("[ShownPromptsService] Error batch recording prompts:",r),!1):(Xe(s),!0)}catch(t){return console.error("[ShownPromptsService] Exception batch recording prompts:",t),!1}}async function hr(s,e){try{const{error:t}=await l.from("ai_shown_prompts").update({clicked:!0,clicked_at:new Date().toISOString()}).eq("auth_user_id",s).eq("prompt_text",e).is("clicked",!1);return t?(console.error("[ShownPromptsService] Error marking prompt clicked:",t),!1):!0}catch(t){return console.error("[ShownPromptsService] Exception marking prompt clicked:",t),!1}}async function pr(s,e,t,r=null){if(!e.length)return[];const a=await Re(s,t,r),o=new Set(a.map(n=>n.toLowerCase().trim()));return e.filter(n=>!o.has(n.toLowerCase().trim()))}async function fr(s,e,t,r=null){const a=await Re(s,t,r),o=e.toLowerCase().trim();return a.some(n=>n.toLowerCase().trim()===o)}const as={getRecentShownPrompts:Re,recordShownPrompt:gr,recordShownPrompts:mr,markPromptClicked:hr,filterNewPrompts:pr,hasPromptBeenShown:fr},K=class K{static getInstance(){return K.instance||(K.instance=new K),K.instance}async getSubtabs(e){return this.getSubtabsFromTable(e)}async setSubtabs(e,t){console.error(`🔄 [SubtabsService] Writing ${t.length} subtabs to normalized table for conversation:`,e);const r=await this.setSubtabsInTable(e,t);return console.error("  ✅ Table write:",r?"SUCCESS":"FAILED"),r}async addSubtab(e,t){const{data:r,error:a}=await l.from("conversations").select("is_unreleased, title").eq("id",e).single();if(a)return console.error("Error checking conversation for unreleased status:",a),null;if(r!=null&&r.is_unreleased)throw new Error("Subtabs cannot be created for unreleased games. This feature will be available once the game is released.");return await this.addSubtabToTable(e,t)}async updateSubtab(e,t,r){return await this.updateSubtabInTable(t,r)}async deleteSubtab(e,t){return this.deleteSubtabFromTable(t)}async getSubtabsFromTable(e){try{const{data:t,error:r}=await l.from("subtabs").select("*").eq("conversation_id",e).order("order_index",{ascending:!0});return r?(console.error("Error getting subtabs from table:",r),[]):(t||[]).map(a=>{const o=typeof a.metadata=="object"&&a.metadata!==null?a.metadata:{};return{id:a.id,conversationId:a.conversation_id??void 0,title:a.title,content:a.content||"",type:a.tab_type,isNew:o.isNew||!1,status:o.status||"loaded",instruction:o.instruction}})}catch(t){return console.error("Error getting subtabs from table:",t),[]}}async setSubtabsInTable(e,t){try{const{data:r,error:a}=await l.from("conversations").select("*").eq("id",e).single(),o=r==null?void 0:r.auth_user_id;if(a||!o)return console.error("❌ [SubtabsService] Error getting conversation auth_user_id:",a),console.error("❌ [SubtabsService] Conversation may not exist yet. ConversationId:",e),!1;console.error(`🔄 [SubtabsService] Using auth_user_id: ${o} for ${t.length} subtabs`);const{error:n}=await l.from("subtabs").delete().eq("conversation_id",e);if(n)return console.error("Error deleting existing subtabs:",n),!1;if(t.length>0){const i=t.map((u,S)=>(u.type||console.error(`⚠️ [SubtabsService] Subtab "${u.title}" has NULL type! Using fallback.`),{id:u.id,conversation_id:e,game_id:null,title:u.title||"Untitled",content:u.content||"",tab_type:u.type||"chat",order_index:S,auth_user_id:o,metadata:{isNew:u.isNew,status:u.status,instruction:u.instruction}}));console.error("🔄 [SubtabsService] Inserting subtabs:",i.map(u=>({title:u.title,tab_type:u.tab_type,has_auth_user_id:!!u.auth_user_id})));const{error:c}=await l.from("subtabs").insert(i);if(c)return console.error("❌ [SubtabsService] Error inserting subtabs:",c),console.error("❌ [SubtabsService] Failed subtabs data:",JSON.stringify(i,null,2)),!1;console.error("✅ [SubtabsService] Successfully inserted",t.length,"subtabs")}return!0}catch(r){return console.error("❌ [SubtabsService] Error setting subtabs in table:",r),!1}}async addSubtabToTable(e,t){var r;try{const{data:a}=await l.from("conversations").select("game_id").eq("id",e).single(),o=(a==null?void 0:a.game_id)||"",{data:n}=await l.from("subtabs").select("order_index").eq("conversation_id",e).order("order_index",{ascending:!1}).limit(1),i=((r=n==null?void 0:n[0])==null?void 0:r.order_index)??-1,{data:c,error:u}=await l.from("subtabs").insert({id:t.id,conversation_id:e,game_id:o,title:t.title,content:t.content,tab_type:t.type,order_index:i+1,metadata:{isNew:t.isNew,status:t.status,instruction:t.instruction}}).select().single();return u?(console.error("Error adding subtab to table:",u),null):{id:c.id,conversationId:c.conversation_id??void 0,title:c.title,content:dt(c.content),type:c.tab_type,isNew:typeof c.metadata=="object"&&c.metadata!==null&&!Array.isArray(c.metadata)&&c.metadata.isNew||!1,status:(typeof c.metadata=="object"&&c.metadata!==null&&!Array.isArray(c.metadata)?c.metadata.status:void 0)||"loaded",instruction:typeof c.metadata=="object"&&c.metadata!==null&&!Array.isArray(c.metadata)?c.metadata.instruction:void 0}}catch(a){return console.error("Error adding subtab to table:",a),null}}async updateSubtabInTable(e,t){try{const r={};if(t.title!==void 0&&(r.title=t.title),t.content!==void 0&&(r.content=t.content),t.type!==void 0&&(r.tab_type=t.type),t.isNew!==void 0||t.status!==void 0||t.instruction!==void 0){const{data:o}=await l.from("subtabs").select("metadata").eq("id",e).single(),n=typeof(o==null?void 0:o.metadata)=="object"&&(o==null?void 0:o.metadata)!==null?o.metadata:{};r.metadata={...n,...t.isNew!==void 0&&{isNew:t.isNew},...t.status!==void 0&&{status:t.status},...t.instruction!==void 0&&{instruction:t.instruction}}}const{error:a}=await l.from("subtabs").update(r).eq("id",e);return a?(console.error("Error updating subtab in table:",a),!1):!0}catch(r){return console.error("Error updating subtab in table:",r),!1}}async deleteSubtabFromTable(e){try{const{error:t}=await l.from("subtabs").delete().eq("id",e);return t?(console.error("Error deleting subtab from table:",t),!1):!0}catch(t){return console.error("Error deleting subtab from table:",t),!1}}async getSubtabsFromJsonb(e){try{const{data:t,error:r}=await l.from("conversations").select("subtabs").eq("id",e).single();return r?(console.error("Error getting subtabs from JSONB:",r),[]):(t==null?void 0:t.subtabs)||[]}catch(t){return console.error("Error getting subtabs from JSONB:",t),[]}}async setSubtabsInJsonb(e,t){try{const{error:r}=await l.from("conversations").update({subtabs:t,subtabs_order:t.map(a=>a.id)}).eq("id",e);return r?(console.error("Error setting subtabs in JSONB:",r),!1):!0}catch(r){return console.error("Error setting subtabs in JSONB:",r),!1}}async migrateConversationSubtabs(e){try{const t=await this.getSubtabsFromJsonb(e);return t.length===0?!0:await this.setSubtabsInTable(e,t)}catch(t){return console.error("Error migrating subtabs:",t),!1}}async rollbackConversationSubtabs(e){try{const t=await this.getSubtabsFromTable(e);return t.length===0?!0:await this.setSubtabsInJsonb(e,t)}catch(t){return console.error("Error rolling back subtabs:",t),!1}}async migrateAllSubtabs(){try{const{data:e,error:t}=await l.from("conversations").select("id, subtabs").not("subtabs","is",null);if(t)return console.error("Error fetching conversations:",t),{success:0,failed:0};let r=0,a=0;const o=(e||[]).filter(i=>i.subtabs&&Array.isArray(i.subtabs)&&i.subtabs.length>0).map(i=>this.migrateConversationSubtabs(i.id));return(await Promise.allSettled(o)).forEach(i=>{i.status==="fulfilled"&&i.value?r++:a++}),{success:r,failed:a}}catch(e){return console.error("Error in batch migration:",e),{success:0,failed:0}}}};E(K,"instance");let Ce=K;const os=Ce.getInstance(),Le={free:3,pro:10,vanguard_pro:10},ns={async canCreateUnreleasedTab(s,e){const t=Le[e]||Le.free,{count:r,error:a}=await l.from("unreleased_game_tabs").select("*",{count:"exact",head:!0}).eq("user_id",s);if(a)return console.error("[UnreleasedTabLimit] Error counting tabs:",a),{canCreate:!0,currentCount:0,limit:t};const o=r||0;return{canCreate:o<t,currentCount:o,limit:t}},async trackUnreleasedTab(s,e,t,r){const{error:a}=await l.from("unreleased_game_tabs").insert({user_id:s,conversation_id:e,game_id:t,game_title:r});return a?(console.error("[UnreleasedTabLimit] Error tracking tab:",a),!1):!0},async untrackUnreleasedTab(s){const{error:e}=await l.from("unreleased_game_tabs").delete().eq("conversation_id",s);return e?(console.error("[UnreleasedTabLimit] Error untracking tab:",e),!1):!0},async getUserUnreleasedTabs(s){const{data:e,error:t}=await l.from("unreleased_game_tabs").select("conversation_id, game_title, created_at").eq("user_id",s).order("created_at",{ascending:!1});return t?(console.error("[UnreleasedTabLimit] Error getting tabs:",t),[]):(e||[]).map(r=>({conversationId:r.conversation_id,gameTitle:r.game_title,createdAt:r.created_at}))}},$=s=>s;class is{static getCurrentUser(){return x.get(M.USER,null)}static setCurrentUser(e){x.set(M.USER,e)}static createUser(e,t=gt.FREE){const r=Date.now(),a=Pe[t];return{id:`user_${r}`,authUserId:`user_${r}`,email:e,tier:t,hasProfileSetup:!1,hasSeenSplashScreens:!1,hasSeenHowToUse:!1,hasSeenFeaturesConnected:!1,hasSeenProFeatures:!1,pcConnected:!1,pcConnectionSkipped:!1,onboardingCompleted:!1,hasWelcomeMessage:!1,isNewUser:!0,hasUsedTrial:!1,lastActivity:r,preferences:{},textCount:0,imageCount:0,textLimit:a.text,imageLimit:a.image,totalRequests:0,lastReset:r,usage:{textCount:0,imageCount:0,textLimit:a.text,imageLimit:a.image,totalRequests:0,lastReset:r,tier:t},appState:{},profileData:{},onboardingData:{},behaviorData:{},feedbackData:{},usageData:{},createdAt:r,updatedAt:r}}static updateUser(e){const t=this.getCurrentUser();if(!t)return;const r={...t,...e,updatedAt:Date.now()};this.setCurrentUser(r)}static updateUsage(e){const t=this.getCurrentUser();t&&this.updateUser({usage:{...t.usage,...e}})}static resetUsage(){const e=this.getCurrentUser();if(!e)return;const t=Pe[e.tier];this.updateUsage({textCount:0,imageCount:0,totalRequests:0,lastReset:Date.now(),textLimit:t.text,imageLimit:t.image})}static canMakeRequest(e){const t=this.getCurrentUser();if(!t)return!1;const{usage:r}=t;return e==="text"?r.textCount<r.textLimit:r.imageCount<r.imageLimit}static incrementUsage(e){const t=this.getCurrentUser();if(!t)return;const r={totalRequests:t.usage.totalRequests+1};e==="text"?r.textCount=t.usage.textCount+1:r.imageCount=t.usage.imageCount+1,this.updateUsage(r)}static logout(){x.remove(M.USER)}static async getCurrentUserAsync(){try{const e=x.get(M.USER,null),{data:{user:t},error:r}=await l.auth.getUser();if(r||!t)return e;const{data:a,error:o}=await l.from("users").select("*").eq("auth_user_id",t.id).single();if(o||!a)return console.error("Failed to fetch user from Supabase:",o),e;const n={id:a.id,authUserId:a.auth_user_id,email:a.email,tier:a.tier,textCount:a.text_count||0,imageCount:a.image_count||0,textLimit:ne(a.text_limit),imageLimit:ne(a.image_limit),totalRequests:a.total_requests||0,lastReset:J(a.last_reset),hasProfileSetup:a.has_profile_setup||!1,hasSeenSplashScreens:a.has_seen_splash_screens||!1,hasSeenHowToUse:a.has_seen_how_to_use||!1,hasSeenFeaturesConnected:a.has_seen_features_connected||!1,hasSeenProFeatures:a.has_seen_pro_features||!1,pcConnected:a.pc_connected||!1,pcConnectionSkipped:a.pc_connection_skipped||!1,onboardingCompleted:a.onboarding_completed||!1,hasWelcomeMessage:a.has_welcome_message||!1,isNewUser:a.is_new_user||!1,hasUsedTrial:a.has_used_trial||!1,lastActivity:J(a.updated_at),preferences:L(a.preferences),usage:{textCount:a.text_count||0,imageCount:a.image_count||0,textLimit:ne(a.text_limit),imageLimit:ne(a.image_limit),totalRequests:a.total_requests||0,lastReset:J(a.last_reset),tier:a.tier},appState:L(a.app_state),profileData:L(a.profile_data),onboardingData:L(a.onboarding_data),behaviorData:L(a.behavior_data),feedbackData:L(a.feedback_data),usageData:L(a.usage_data),createdAt:J(a.created_at),updatedAt:J(a.updated_at)};return x.set(M.USER,n),n}catch(e){return console.error("Error in getCurrentUserAsync:",e),x.get(M.USER,null)}}static async setCurrentUserAsync(e){try{x.set(M.USER,e);const{error:t}=await l.from("users").update({tier:e.tier,text_count:e.textCount,image_count:e.imageCount,text_limit:e.textLimit,image_limit:e.imageLimit,total_requests:e.totalRequests,last_reset:new Date(e.lastReset).toISOString(),has_profile_setup:e.hasProfileSetup,has_seen_splash_screens:e.hasSeenSplashScreens,has_seen_how_to_use:e.hasSeenHowToUse,has_seen_features_connected:e.hasSeenFeaturesConnected,has_seen_pro_features:e.hasSeenProFeatures,pc_connected:e.pcConnected,pc_connection_skipped:e.pcConnectionSkipped,onboarding_completed:e.onboardingCompleted,has_welcome_message:e.hasWelcomeMessage,has_used_trial:e.hasUsedTrial,preferences:$(e.preferences),profile_data:$(e.profileData),app_state:$(e.appState),onboarding_data:$(e.onboardingData),behavior_data:$(e.behaviorData),feedback_data:$(e.feedbackData),usage_data:$(e.usageData),updated_at:new Date().toISOString()}).eq("auth_user_id",e.authUserId);t&&console.error("Failed to sync user to Supabase:",t)}catch(t){console.error("Error in setCurrentUserAsync:",t)}}static async updateUsageAsync(e){const t=await this.getCurrentUserAsync();if(!t)return;const r={...t,usage:{...t.usage,...e},textCount:e.textCount??t.textCount,imageCount:e.imageCount??t.imageCount,totalRequests:e.totalRequests??t.totalRequests,lastReset:e.lastReset??t.lastReset,updatedAt:Date.now()};await this.setCurrentUserAsync(r)}}class yr{hasTabCommand(e){return/^@\w+/.test(e.trim())}parseTabCommand(e,t){const r=e.trim();if(!this.hasTabCommand(r))return null;const a=r.match(/^@(\w+)\s*(\\modify|\\delete)?\s*(.*)$/);if(!a)return null;const[,o,n,i]=a,c=this.findMatchingTab(o,t.subtabs||[]);if(!c)return null;let u;return n==="\\delete"?u="delete":n==="\\modify"?u="modify":u="update",{type:u,tabId:c.id,tabName:c.title,instruction:i.trim()}}findMatchingTab(e,t){const r=this.normalizeTabName(e);let a=t.find(o=>this.normalizeTabName(o.id)===r||this.normalizeTabName(o.title)===r);return a||(a=t.find(o=>this.normalizeTabName(o.id).includes(r)||this.normalizeTabName(o.title).includes(r)),a)?a:(a=t.find(o=>r.includes(this.normalizeTabName(o.id))||r.includes(this.normalizeTabName(o.title))),a||null)}normalizeTabName(e){return e.toLowerCase().replace(/[_\s-]+/g,"").replace(/[^a-z0-9]/g,"")}getAvailableTabNames(e){return!e.subtabs||e.subtabs.length===0?[]:e.subtabs.map(t=>({id:t.id,title:t.title}))}formatTabSuggestion(e,t){return`@${e}`}getCommandHelp(){return`
**Tab Commands:**
• @<tab> <text> - Update tab with new info
• @<tab> \\modify <text> - Modify/rename tab
• @<tab> \\delete - Delete tab

Example: @story_so_far The player defeated the first boss
    `.trim()}validateCommand(e){switch(e.type){case"update":if(!e.instruction)return{valid:!1,error:"Update command requires content. Example: @story_so_far The player..."};break;case"modify":if(!e.instruction)return{valid:!1,error:"Modify command requires instructions. Example: @tips \\modify Change to combat strategies"};break}return{valid:!0}}describeCommand(e){switch(e.type){case"update":return`Updating "${e.tabName}" with: ${e.instruction}`;case"modify":return`Modifying "${e.tabName}": ${e.instruction}`;case"delete":return`Deleting "${e.tabName}"`}}}const cs=new yr;let g,q=[],xe=!1,z="",D=null,G=null,O=null,U=null;const Sr="otakonSpeechRate",ke=async()=>{try{const s=navigator;if(s.wakeLock){if(D!==null)try{await D.release()}catch{}D=await s.wakeLock.request("screen"),console.log("🔒 [TTS] Wake lock acquired - screen will stay on"),D.addEventListener("release",async()=>{console.log("🔓 [TTS] Wake lock released"),D=null,g&&g.speaking&&(console.log("🔒 [TTS] Reacquiring wake lock (TTS still active)"),await ke())})}else console.warn("⚠️ [TTS] Wake lock API not available")}catch(s){console.warn("⚠️ [TTS] Wake lock request failed:",s)}},Qe=async()=>{try{D!==null&&(await D.release(),D=null)}catch{}},br=()=>{try{if(!G){const s=window,e=s.AudioContext||s.webkitAudioContext;e&&(G=new e,console.log("🔊 [TTS] Audio context initialized"))}O||(O=new Audio,O.src="data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACBhYqFbF1fdJivrJBhNjVgodDbq2EcBj+a2teleShtr9teleShtr9teleShtr9teleShtr9t",O.loop=!0,O.volume=.01,O.load(),console.log("🔇 [TTS] Silent audio initialized for background playback"))}catch(s){console.warn("⚠️ [TTS] Audio context init failed:",s)}},Ze=async()=>{try{G&&G.state==="suspended"&&(await G.resume(),console.log("🔊 [TTS] Audio context resumed")),O&&(O.currentTime=0,await O.play(),console.log("🔇 [TTS] Silent audio playing for background session")),U||(U=setInterval(()=>{g&&g.speaking?G&&G.state==="suspended"&&G.resume().catch(()=>{}):U&&(clearInterval(U),U=null)},5e3))}catch(s){console.warn("⚠️ [TTS] Silent audio start failed:",s)}},et=()=>{try{O&&(O.pause(),O.currentTime=0,console.log("🔇 [TTS] Silent audio stopped")),U&&(clearInterval(U),U=null)}catch(s){console.warn("⚠️ [TTS] Silent audio stop failed:",s)}},Er=()=>new Promise((s,e)=>{if(!g)return e(new Error("Speech synthesis not initialized."));if(q=g.getVoices(),q.length>0){s();return}g.onvoiceschanged=()=>{q=g.getVoices(),s()},setTimeout(()=>{q.length===0&&(q=g.getVoices()),s()},1e3)}),se=()=>{g&&g.speaking&&g.cancel(),z="","mediaSession"in navigator&&navigator.mediaSession.playbackState!=="none"&&(navigator.mediaSession.playbackState="paused"),Qe(),et(),window.dispatchEvent(new CustomEvent("otakon:ttsStopped"))},tt=()=>{g&&g.speaking&&!g.paused&&(g.pause(),"mediaSession"in navigator&&(navigator.mediaSession.playbackState="paused"),window.dispatchEvent(new CustomEvent("otakon:ttsPaused")))},rt=()=>{g&&g.paused&&(g.resume(),"mediaSession"in navigator&&(navigator.mediaSession.playbackState="playing"),window.dispatchEvent(new CustomEvent("otakon:ttsResumed")))},Tr=async()=>{z&&(se(),await at(z))},wr=()=>g?g.speaking:!1,_r=()=>{se(),window.dispatchEvent(new CustomEvent("otakon:disableHandsFree"))},Ar=()=>{if("mediaSession"in navigator){console.log("🎵 [TTS] Setting up media session");try{navigator.mediaSession.setActionHandler("play",()=>{console.log("🎵 [TTS] Media session play action"),g&&g.paused&&rt()}),navigator.mediaSession.setActionHandler("pause",()=>{console.log("🎵 [TTS] Media session pause action"),g&&g.speaking&&!g.paused&&tt()}),navigator.mediaSession.setActionHandler("stop",()=>{console.log("🎵 [TTS] Media session stop action"),_r()}),console.log("✅ [TTS] Media session handlers registered")}catch(s){console.warn("⚠️ [TTS] Failed to set media session handlers:",s)}}else console.warn("⚠️ [TTS] Media session API not available")},Or=async()=>{document.hidden?(console.log("📱 [TTS] App went to background, isSpeaking:",g==null?void 0:g.speaking),g&&g.speaking&&(await Ze(),g.paused||setTimeout(()=>{g&&g.speaking&&!g.paused&&console.log("📱 [TTS] Nudging speech synthesis to stay alive")},100))):(console.log("📱 [TTS] App came to foreground, isSpeaking:",g==null?void 0:g.speaking),g&&g.speaking&&await ke())},vr=async()=>{if(typeof window<"u"&&"speechSynthesis"in window){if(xe)return;xe=!0,g=window.speechSynthesis,await Er(),Ar(),br(),document.addEventListener("visibilitychange",Or),g.getVoices().length===0&&g.speak(new SpeechSynthesisUtterance(""))}},st=()=>q.filter(s=>s.lang.startsWith("en-")),at=async s=>new Promise((e,t)=>{try{if(!g)return console.error("Text-to-Speech is not available on this browser."),t(new Error("Text-to-Speech is not available on this browser."));if(!s.trim())return e();se(),z=s;const r=new SpeechSynthesisUtterance(s),a=localStorage.getItem(Sr);r.rate=a?parseFloat(a):.94;const o=localStorage.getItem("otakonPreferredVoiceURI"),n=st();let i;if(o&&(i=n.find(c=>c.voiceURI===o)),!i&&n.length>0){const c=n.find(u=>u.name.toLowerCase().includes("female"));c?i=c:i=n[0]}i&&(r.voice=i),r.onstart=async()=>{if(console.log("🎤 [TTS] Speech started"),z=s,await ke(),await Ze(),"serviceWorker"in navigator&&navigator.serviceWorker.controller&&navigator.serviceWorker.controller.postMessage({type:"TTS_STARTED"}),"mediaSession"in navigator)try{navigator.mediaSession.playbackState="playing";const c=s.replace(/[*_~`#]/g,"").replace(/\n+/g," ").trim(),u=c.length>100?c.substring(0,97)+"...":c;navigator.mediaSession.metadata=new MediaMetadata({title:u,artist:"Otagon AI",album:"Gaming Companion",artwork:[{src:"/icon-192.png",sizes:"192x192",type:"image/png"},{src:"/icon-512.png",sizes:"512x512",type:"image/png"}]}),console.log("🎵 [TTS] Media session metadata set")}catch(c){console.warn("⚠️ [TTS] Failed to set media session:",c)}window.dispatchEvent(new CustomEvent("otakon:ttsStarted"))},r.onend=()=>{z="","mediaSession"in navigator&&(navigator.mediaSession.playbackState="paused"),"serviceWorker"in navigator&&navigator.serviceWorker.controller&&navigator.serviceWorker.controller.postMessage({type:"TTS_STOPPED"}),Qe(),et(),window.dispatchEvent(new CustomEvent("otakon:ttsStopped")),e()},r.onerror=c=>{console.error("SpeechSynthesis Utterance Error",c),se(),t(c)},g.speak(r)}catch(r){console.error("TTS Error:",r),t(r)}}),ls={init:vr,getAvailableVoices:st,speak:at,cancel:se,pause:tt,resume:rt,restart:Tr,isSpeaking:wr};class Cr{constructor(){E(this,"submittedFeedback",new Set)}hasSubmittedFeedback(e){return this.submittedFeedback.has(e)}async submitFeedback(e){try{const t=oe.getCurrentUser();if(!(t!=null&&t.authUserId))return console.warn("[FeedbackService] User not authenticated"),{success:!1,error:"User not authenticated"};if(this.submittedFeedback.has(e.messageId))return console.log("[FeedbackService] Feedback already submitted for message:",e.messageId),{success:!0};const{error:r}=await l.from("ai_feedback").insert({user_id:t.authUserId,conversation_id:e.conversationId,message_id:e.messageId,feedback_type:e.feedbackType,content_type:e.contentType,category:e.category||null,comment:e.comment||null});return r?r.code==="23505"?(console.log("[FeedbackService] Feedback already exists in database"),this.submittedFeedback.add(e.messageId),{success:!0}):(console.error("[FeedbackService] Failed to submit feedback:",r),{success:!1,error:r.message}):(this.submittedFeedback.add(e.messageId),console.log("[FeedbackService] Feedback submitted:",{messageId:e.messageId,type:e.feedbackType,contentType:e.contentType}),{success:!0})}catch(t){return console.error("[FeedbackService] Error submitting feedback:",t),{success:!1,error:"Failed to submit feedback"}}}async submitPositiveFeedback(e,t,r="message"){return this.submitFeedback({messageId:e,conversationId:t,feedbackType:"up",contentType:r})}async submitNegativeFeedback(e,t,r,a,o="message"){return this.submitFeedback({messageId:e,conversationId:t,feedbackType:"down",contentType:o,category:r,comment:a})}async submitCorrection(e){try{const t=oe.getCurrentUser();if(!(t!=null&&t.authUserId))return console.warn("[FeedbackService] User not authenticated for correction"),{success:!1,error:"User not authenticated"};if(!F.getRateLimitStatus().allowed)return{success:!1,error:"Daily correction limit reached. Try again tomorrow.",rateLimitRemaining:0};const a={originalResponse:e.originalResponse,correctionText:e.correctionText,type:e.correctionType,scope:e.correctionScope,gameTitle:e.gameTitle,messageId:e.messageId,conversationId:e.conversationId},o=await F.submitCorrection(t.authUserId,a);return o.success?(console.log("[FeedbackService] Correction submitted successfully:",{messageId:e.messageId,type:e.correctionType,scope:e.correctionScope}),{success:!0,correction:o.correction,rateLimitRemaining:F.getRateLimitStatus().remaining}):{success:!1,error:o.error,rateLimitRemaining:F.getRateLimitStatus().remaining}}catch(t){return console.error("[FeedbackService] Error submitting correction:",t),{success:!1,error:"Failed to submit correction"}}}getCorrectionRateLimit(){return F.getRateLimitStatus()}async getUserCorrections(){const e=oe.getCurrentUser();return e!=null&&e.authUserId?F.getAllCorrections(e.authUserId):[]}async toggleCorrection(e,t){const r=oe.getCurrentUser();return r!=null&&r.authUserId?F.toggleCorrection(r.authUserId,e,t):!1}async getFeedbackStats(){try{const{data:e,error:t}=await l.from("ai_feedback").select("feedback_type, category");if(t)return console.error("[FeedbackService] Failed to get feedback stats:",t),null;const r={totalFeedback:e.length,positiveCount:e.filter(a=>a.feedback_type==="up").length,negativeCount:e.filter(a=>a.feedback_type==="down").length,categoryBreakdown:{}};return e.forEach(a=>{a.category&&(r.categoryBreakdown[a.category]=(r.categoryBreakdown[a.category]||0)+1)}),r}catch(e){return console.error("[FeedbackService] Error getting feedback stats:",e),null}}clearLocalTracking(){this.submittedFeedback.clear()}}const Ir=new Cr,us=Object.freeze(Object.defineProperty({__proto__:null,feedbackService:Ir},Symbol.toStringTag,{value:"Module"}));function Nr(s){var n;const e=s.split(","),t=((n=e[0].match(/:(.*?);/))==null?void 0:n[1])||"image/png",r=atob(e[1]),a=r.length,o=new Uint8Array(a);for(let i=0;i<a;i++)o[i]=r.charCodeAt(i);return new Blob([o],{type:t})}async function Rr(s,e){try{const t=Nr(s),r=t.size,a=50*1024*1024;if(r>a)return{success:!1,error:"Screenshot exceeds 50MB size limit"};const o=Date.now(),n=Math.random().toString(36).substring(2,15),i=`${o}_${n}.png`,c=`${e}/${i}`,{error:u}=await l.storage.from("screenshots").upload(c,t,{contentType:"image/png",cacheControl:"3600",upsert:!1});if(u)return console.error("Screenshot upload error:",u),{success:!1,error:u.message};const{data:S}=l.storage.from("screenshots").getPublicUrl(c);return S!=null&&S.publicUrl?{success:!0,publicUrl:S.publicUrl,fileSize:r}:{success:!1,error:"Failed to generate public URL"}}catch(t){return console.error("Screenshot upload exception:",t),{success:!1,error:t instanceof Error?t.message:"Unknown error"}}}const ds=Object.freeze(Object.defineProperty({__proto__:null,uploadScreenshot:Rr},Symbol.toStringTag,{value:"Module"})),le=new Map;class kr{constructor(){E(this,"MAX_WORDS",300);E(this,"RECENT_MESSAGE_COUNT",8)}countWords(e){return e.trim().split(/\s+/).filter(t=>t.length>0).length}getTotalWordCount(e){return e.reduce((t,r)=>{const a=this.countWords(r.content);return t+a},0)}shouldSummarize(e){return!e.messages||e.messages.length<=this.RECENT_MESSAGE_COUNT?!1:this.getTotalWordCount(e.messages)>this.MAX_WORDS*3}splitMessages(e){if(e.length<=this.RECENT_MESSAGE_COUNT)return{toSummarize:[],toKeep:e};const t=e.length-this.RECENT_MESSAGE_COUNT;return{toSummarize:e.slice(0,t),toKeep:e.slice(t)}}async summarizeMessages(e,t,r){const a=this.getTotalWordCount(e),o=e.map(c=>`${c.role==="user"?"User":"Assistant"}: ${c.content}`).join(`

`),i=`${t&&r?`This is a conversation about "${t}" (${r}).`:"This is a general conversation."}

Please provide a concise summary of the following conversation history. Focus on:
- Key topics discussed
- Important decisions or choices made
- Game progress or story developments (if applicable)
- User preferences or interests mentioned

Keep the summary under ${this.MAX_WORDS} words while preserving essential context.

Conversation to summarize:
${o}

Provide ONLY the summary, no additional commentary.`;try{const c={id:"temp-summary",title:"Summary Request",messages:[{id:"summary-msg-"+Date.now(),role:"user",content:i,timestamp:Date.now()}],createdAt:Date.now(),updatedAt:Date.now(),isActive:!1,isGameHub:!1};console.log(`📡 [GEMINI CALL #2] 📋 Context Summarization | Messages: ${e.length} | Game: ${t||"N/A"} | Target: ${this.MAX_WORDS} words`);const u={id:"system",email:"system@otakon.ai",profileData:null},T=(await mt.getChatResponse(c,u,i,!1,!1,void 0,void 0,"summarization")).content.trim(),p=this.countWords(T);return console.log(`✅ [GEMINI CALL] Context Summarization SUCCESS | ${p} words (reduced from ${a})`),Z.success(`Conversation summarized (${a} → ${p} words)`),le.delete("summarization"),{summary:T,wordCount:p,messagesIncluded:e.length,originalWordCount:a}}catch(c){console.error("❌ [ContextSummarization] Failed to generate summary:",c);const u=le.get("summarization")||0,S=3;if(u<S)return le.set("summarization",u+1),console.log(`🔄 [ContextSummarization] Retry ${u+1}/${S} in 1 second...`),await new Promise(p=>setTimeout(p,1e3)),this.summarizeMessages(e,t,r);console.error("❌ [ContextSummarization] Max retries reached"),le.delete("summarization");const T=e.slice(0,5).map(p=>p.content.substring(0,100)).join(" ... ").substring(0,this.MAX_WORDS*6);return{summary:`[Previous conversation context] ${T}`,wordCount:this.countWords(T),messagesIncluded:e.length,originalWordCount:a}}}async applyContextSummarization(e){if(!this.shouldSummarize(e))return e;const{toSummarize:t,toKeep:r}=this.splitMessages(e.messages);if(t.length===0)return e;const a=await this.summarizeMessages(t,e.gameTitle,e.genre),n=[{id:"summary-"+Date.now(),role:"system",content:a.summary,timestamp:t[t.length-1].timestamp,metadata:{isSummary:!0,messagesIncluded:a.messagesIncluded,originalWordCount:a.originalWordCount,summaryWordCount:a.wordCount}},...r],i=a.summary.replace(/!\[.*?\]\(data:image\/.*?\)/g,""),c=i.split(/\s+/).filter(S=>S.length>0),u=c.length>500?c.slice(0,500).join(" ")+"...":i;return console.log(`✅ [ContextSummarization] Context optimized: ${e.messages.length} messages → ${n.length} (${a.originalWordCount} words → ${a.wordCount} + recent)`),{...e,messages:n,contextSummary:u,lastSummarizedAt:Date.now(),updatedAt:Date.now()}}async getOptimizedContext(e){return this.shouldSummarize(e)?(await this.applyContextSummarization(e)).messages:e.messages}willTriggerSummarization(e){return this.getTotalWordCount(e.messages)>this.MAX_WORDS*3*.8}}const Pr=new kr,gs=Object.freeze(Object.defineProperty({__proto__:null,contextSummarizationService:Pr},Symbol.toStringTag,{value:"Module"}));export{Fr as A,$r as B,us as C,ds as D,ie as E,gs as F,is as U,Kr as W,qr as a,F as b,es as c,R as d,Zr as e,Xr as f,Qr as g,ts as h,j as i,ls as j,ss as k,cs as l,zr as m,jr as n,Vr as o,Yr as p,Jr as q,os as r,Wr as s,Z as t,ns as u,Hr as v,Tt as w,rs as x,as as y,Br as z};
