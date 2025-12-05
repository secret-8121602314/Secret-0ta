const __vite__mapDeps=(i,m=__vite__mapDeps,d=(m.f||(m.f=["assets/chat-services-D8MNpsFF.js","assets/ai-vendor-DDPwdD9r.js","assets/core-services-BxYOPokQ.js","assets/auth-bueVZ83V.js","assets/react-vendor-CoI0GbAp.js","assets/vendor-OLJdJXZA.js","assets/markdown-vendor-DUxMcM1W.js","assets/supabase-vendor-Cssajyrh.js"])))=>i.map(i=>d[i]);
var yt=Object.defineProperty;var bt=(a,e,t)=>e in a?yt(a,e,{enumerable:!0,configurable:!0,writable:!0,value:t}):a[e]=t;var S=(a,e,t)=>bt(a,typeof e!="symbol"?e+"":e,t);import{s as d}from"./auth-bueVZ83V.js";import{n as Et,a as A,i as ze,b as at,S as K,U as wt,T as Ye,_ as je,F as pe}from"./chat-services-D8MNpsFF.js";import{b as ke,c as re,j as x,d as fe,t as Se,a as ye}from"./core-services-BxYOPokQ.js";class Tt{constructor(){S(this,"memoryCache",new Map);S(this,"DEFAULT_TTL",300*1e3);S(this,"CACHE_TABLE","app_cache");S(this,"MAX_MEMORY_CACHE_SIZE",100);S(this,"pendingRequests",new Map)}async set(e,t,r=this.DEFAULT_TTL,s="general",n){const o=Date.now()+r;this.memoryCache.set(e,{value:t,expires:o});try{console.log(`[CacheService] Storing in Supabase: ${e} (type: ${s}, user: ${n||"none"})`);const{error:i}=await d.from(this.CACHE_TABLE).upsert({key:e,value:JSON.stringify(t),expires_at:new Date(o).toISOString(),updated_at:new Date().toISOString(),cache_type:s,user_id:n||null,size_bytes:JSON.stringify(t).length});i&&console.debug("[CacheService] Cache write failed:",i.message)}catch{}this.memoryCache.size>this.MAX_MEMORY_CACHE_SIZE&&this.cleanupMemoryCache()}async get(e,t=!1){if(this.pendingRequests.has(e))return await this.pendingRequests.get(e);const r=this.memoryCache.get(e);if(r&&Date.now()<=r.expires)return console.log(`[CacheService] Cache HIT (memory): ${e}`),r.value;if(r&&this.memoryCache.delete(e),t)return console.log(`[CacheService] Cache MISS (memory-only mode): ${e}`),null;const s=this.fetchFromSupabase(e);this.pendingRequests.set(e,s);try{return await s}finally{this.pendingRequests.delete(e)}}async fetchFromSupabase(e){try{console.log(`[CacheService] Cache MISS (memory), trying Supabase: ${e}`);const{data:t,error:r}=await d.from(this.CACHE_TABLE).select("value, expires_at").eq("key",e).maybeSingle();if(r)return null;if(!t)return console.log(`[CacheService] Cache MISS (Supabase): ${e}`),null;const s=new Date(t.expires_at).getTime();if(Date.now()>s)return console.log(`[CacheService] Cache EXPIRED (Supabase): ${e}`),await this.delete(e),null;console.log(`[CacheService] Cache HIT (Supabase): ${e}`);const n=JSON.parse(typeof t.value=="string"?t.value:"{}");return this.memoryCache.set(e,{value:n,expires:s}),n}catch{return null}}async has(e){return await this.get(e)!==null}async delete(e){const t=this.memoryCache.delete(e);try{const{error:r}=await d.from(this.CACHE_TABLE).delete().eq("key",e);r&&console.debug("[CacheService] Delete failed:",r.message)}catch{}return t}async clear(){this.memoryCache.clear(),this.pendingRequests.clear();try{const{error:e}=await d.from(this.CACHE_TABLE).delete().neq("key","never_delete");e&&console.debug("[CacheService] Clear failed:",e.message)}catch{}}async cleanup(){const e=Date.now();this.cleanupMemoryCache();try{const{error:t}=await d.from(this.CACHE_TABLE).delete().lt("expires_at",new Date(e).toISOString());t&&console.debug("[CacheService] Cleanup failed:",t.message)}catch{}}cleanupMemoryCache(){const e=Date.now(),t=Array.from(this.memoryCache.entries());t.forEach(([r,s])=>{e>s.expires&&this.memoryCache.delete(r)}),this.memoryCache.size>this.MAX_MEMORY_CACHE_SIZE&&t.filter(([n])=>this.memoryCache.has(n)).sort((n,o)=>n[1].expires-o[1].expires).slice(0,this.memoryCache.size-this.MAX_MEMORY_CACHE_SIZE).forEach(([n])=>this.memoryCache.delete(n))}getStats(){return{memorySize:this.memoryCache.size,memoryKeys:Array.from(this.memoryCache.keys())}}async getSupabaseStats(){try{const{data:e,error:t}=await d.rpc("get_cache_stats");return t?null:e}catch{return null}}async getPerformanceMetrics(){try{const{data:e,error:t}=await d.rpc("get_cache_performance_metrics");return t?null:e}catch{return null}}async getUserCacheEntries(e){try{const{data:t,error:r}=await d.rpc("get_user_cache_entries",{p_user_id:e});return r?[]:t||[]}catch{return[]}}async clearUserCache(e){try{const{data:t,error:r}=await d.rpc("clear_user_cache",{p_user_id:e});return r?0:t||0}catch{return 0}}async setChatContext(e,t){await this.set(`chat_context:${e}`,t,2160*60*60*1e3,"context",e)}async getChatContext(e){return await this.get(`chat_context:${e}`)}async setUserMemory(e,t){await this.set(`user_memory:${e}`,t,365*24*60*60*1e3,"memory",e)}async getUserMemory(e){return await this.get(`user_memory:${e}`)}async setGameContext(e,t,r){await this.set(`game_context:${e}:${t}`,r,2160*60*60*1e3,"context",e)}async getGameContext(e,t){return await this.get(`game_context:${e}:${t}`)}async setUser(e,t){await this.set(`user:${e}`,t,365*24*60*60*1e3,"user",e)}async getUser(e){return await this.get(`user:${e}`)}async setRateLimit(e,t){await this.set(`rate_limit:${e}`,t,900*1e3,"rate_limit")}async getRateLimit(e){return await this.get(`rate_limit:${e}`)}async setConversation(e,t,r){await this.set(`conversation:${e}`,t,365*24*60*60*1e3,"conversation",r)}async getConversation(e){return await this.get(`conversation:${e}`)}async initializeCacheTable(){try{const{error:e}=await d.from(this.CACHE_TABLE).select("key").limit(1);e&&e.code}catch{}}}const R=new Tt;R.initializeCacheTable().catch(()=>{});setInterval(()=>{R.cleanup()},300*1e3);class _t{constructor(){S(this,"toasts",[]);S(this,"listeners",new Set);S(this,"maxToasts",5)}subscribe(e){return this.listeners.add(e),e(this.toasts),()=>{this.listeners.delete(e)}}notify(){this.listeners.forEach(e=>e([...this.toasts]))}show(e,t="info",r={}){const s=`toast-${Date.now()}-${Math.random().toString(36).substr(2,9)}`,n={id:s,message:e,type:t,duration:r.duration??this.getDefaultDuration(t),action:r.action,dismissible:r.dismissible??!0};return this.toasts.unshift(n),this.toasts.length>this.maxToasts&&(this.toasts=this.toasts.slice(0,this.maxToasts)),this.notify(),n.duration&&n.duration>0&&setTimeout(()=>this.dismiss(s),n.duration),s}success(e,t){return this.show(e,"success",{duration:3e3,...t})}error(e,t){return this.show(e,"error",{duration:7e3,dismissible:!0,...t})}warning(e,t){return this.show(e,"warning",{duration:5e3,...t})}info(e,t){return this.show(e,"info",{duration:4e3,...t})}dismiss(e){const t=this.toasts.findIndex(r=>r.id===e);t!==-1&&(this.toasts.splice(t,1),this.notify())}dismissAll(){this.toasts=[],this.notify()}getDefaultDuration(e){switch(e){case"success":return 3e3;case"error":return 7e3;case"warning":return 5e3;case"info":return 4e3;default:return 4e3}}loading(e){const t=this.show(e,"info",{duration:0,dismissible:!1});return()=>this.dismiss(t)}async promise(e,t){const r=this.loading(t.loading);try{const s=await e;r();const n=typeof t.success=="function"?t.success(s):t.success;return this.success(n),s}catch(s){r();const n=typeof t.error=="function"?t.error(s):t.error;throw this.error(n),s}}}const ae=new _t;let ce=!1;typeof window<"u"&&typeof document<"u"&&(document.addEventListener("visibilitychange",()=>{ce=document.hidden}),window.addEventListener("blur",()=>{ce=!0}),window.addEventListener("focus",()=>{document.hidden||(ce=!1)}));const vt=async(a,e="Otagon AI")=>{if(!(!ce&&!document.hidden)&&!(!("Notification"in window)||Notification.permission!=="granted"))try{const t=a.length>100?a.substring(0,97)+"...":a,r=new Notification(e,{body:t,icon:"/icon-192.png",badge:"/icon-192.png",tag:"otagon-ai-response",requireInteraction:!1,silent:!1});setTimeout(()=>r.close(),1e4),r.onclick=()=>{window.focus(),r.close()}}catch(t){console.error("Failed to show notification:",t)}},At=()=>ce||document.hidden,ts=Object.freeze(Object.defineProperty({__proto__:null,isScreenLockedOrHidden:At,showAINotification:vt,toastService:ae},Symbol.toStringTag,{value:"Module"}));class be{static handle(e,t,r){this.errorCount++,!this.isErrorRateLimited()&&(console.error(`[${t}]`,{message:e.message,stack:e.stack,context:t,timestamp:new Date().toISOString(),errorCount:this.errorCount}),r&&this.showUserMessage(r),this.reportError(e,t))}static handleAuthError(e,t){const r=this.getAuthErrorMessage(t);this.handle(e,`AuthService:${t}`,r)}static handleWebSocketError(e,t){const r=this.getWebSocketErrorMessage(t);this.handle(e,`WebSocketService:${t}`,r)}static handleConversationError(e,t){const r=this.getConversationErrorMessage(t);this.handle(e,`ConversationService:${t}`,r)}static handleDatabaseError(e,t){const r=this.getDatabaseErrorMessage(t);this.handle(e,`DatabaseService:${t}`,r)}static isErrorRateLimited(){const e=Date.now();return this.recentErrors=this.recentErrors.filter(t=>e-t<this.errorWindow),this.recentErrors.push(e),this.recentErrors.length>this.maxErrorsPerMinute}static showUserMessage(e){}static reportError(e,t){console.warn("[Error Reporting] Would report error to monitoring service:",{error:e.message,context:t,timestamp:new Date().toISOString()})}static getAuthErrorMessage(e){return{signIn:"Failed to sign in. Please check your credentials and try again.",signOut:"Failed to sign out. Please try again.",loadUser:"Failed to load user data. Please refresh the page.",createUser:"Failed to create user account. Please try again.",refreshUser:"Failed to refresh user data. Please try again."}[e]||"An authentication error occurred. Please try again."}static getWebSocketErrorMessage(e){return{connect:"Failed to connect to server. Please check your internet connection.",send:"Failed to send message. Please try again.",disconnect:"Failed to disconnect. Please try again."}[e]||"A connection error occurred. Please try again."}static getConversationErrorMessage(e){return{create:"Failed to create conversation. Please try again.",load:"Failed to load conversations. Please refresh the page.",save:"Failed to save conversation. Please try again.",delete:"Failed to delete conversation. Please try again."}[e]||"A conversation error occurred. Please try again."}static getDatabaseErrorMessage(e){return{save:"Failed to save data. Please try again.",load:"Failed to load data. Please refresh the page.",update:"Failed to update data. Please try again.",delete:"Failed to delete data. Please try again."}[e]||"A database error occurred. Please try again."}static getStats(){return{totalErrors:this.errorCount,recentErrors:this.recentErrors.length,isRateLimited:this.isErrorRateLimited()}}static reset(){this.errorCount=0,this.recentErrors=[]}}S(be,"errorCount",0),S(be,"maxErrorsPerMinute",10),S(be,"errorWindow",60*1e3),S(be,"recentErrors",[]);const V=class V{constructor(){S(this,"currentSessionId",null);S(this,"sessionStartTime",null);S(this,"activityCount",0);S(this,"heartbeatInterval",null)}static getInstance(){return V.instance||(V.instance=new V),V.instance}async startSession(e,t){try{this.currentSessionId&&await this.endSession();const r={initialRoute:t,activityCount:0,deviceInfo:this.getDeviceInfo()},{data:s,error:n}=await d.from("user_sessions").insert({user_id:e,started_at:new Date().toISOString(),session_data:r}).select("id").single();return n?(console.error("Failed to start session:",n),null):(this.currentSessionId=s.id,this.sessionStartTime=Date.now(),this.activityCount=0,this.startHeartbeat(),this.currentSessionId)}catch(r){return console.error("Error starting session:",r),null}}async endSession(){if(!(!this.currentSessionId||!this.sessionStartTime))try{const e=Math.floor((Date.now()-this.sessionStartTime)/1e3),{error:t}=await d.from("user_sessions").update({ended_at:new Date().toISOString(),duration_seconds:e,session_data:{activityCount:this.activityCount,lastActivity:new Date().toISOString()}}).eq("id",this.currentSessionId);t?console.error("Failed to end session:",t):console.log(`✅ Session ended: ${this.currentSessionId} (${e}s)`),this.stopHeartbeat(),this.currentSessionId=null,this.sessionStartTime=null,this.activityCount=0}catch(e){console.error("Error ending session:",e)}}trackActivity(e){this.currentSessionId&&(this.activityCount++,d.from("user_sessions").update({session_data:{activityCount:this.activityCount,lastActivity:new Date().toISOString(),lastActivityType:e}}).eq("id",this.currentSessionId).then(({error:t})=>{t&&console.error("Failed to track activity:",t)}))}async updateSessionData(e){if(this.currentSessionId)try{const{error:t}=await d.from("user_sessions").update({session_data:e}).eq("id",this.currentSessionId);t&&console.error("Failed to update session data:",t)}catch(t){console.error("Error updating session data:",t)}}getCurrentSessionId(){return this.currentSessionId}getSessionDuration(){return this.sessionStartTime?Math.floor((Date.now()-this.sessionStartTime)/1e3):0}startHeartbeat(){this.heartbeatInterval=setInterval(()=>{this.trackActivity("heartbeat")},300*1e3)}stopHeartbeat(){this.heartbeatInterval&&(clearInterval(this.heartbeatInterval),this.heartbeatInterval=null)}getDeviceInfo(){const{userAgent:e}=navigator,t=/Mobile|Android|iPhone|iPad/.test(e),r=/Tablet|iPad/.test(e);let s="desktop";return t&&!r&&(s="mobile"),r&&(s="tablet"),s}cleanup(){this.stopHeartbeat(),this.currentSessionId&&this.endSession().catch(console.error)}};S(V,"instance");let Ge=V;const Ct=Ge.getInstance();typeof window<"u"&&window.addEventListener("beforeunload",()=>{Ct.cleanup()});const Ee=a=>a,J=class J{constructor(){}static getInstance(){return J.instance||(J.instance=new J),J.instance}async getOnboardingStatus(e){try{const{data:t,error:r}=await d.rpc("get_user_onboarding_status",{p_user_id:e});if(r)return console.error("🎯 [OnboardingService] Error getting onboarding status:",r),null;if(!t||t.length===0)return null;const s=t[0];return console.log("🎯 [OnboardingService] Onboarding status (first element):",s),s}catch(t){return console.error("🎯 [OnboardingService] Error getting onboarding status:",t),null}}async updateOnboardingStatus(e,t,r={}){try{const{error:s}=await d.rpc("update_user_onboarding_status",{p_user_id:e,p_step:t,p_data:Ee(r)});return s?(console.error("Error updating onboarding status:",s),!1):!0}catch(s){return console.error("Error updating onboarding status:",s),!1}}async getOnboardingProgress(e){try{const{data:t,error:r}=await d.from("onboarding_progress").select("*").eq("user_id",e).order("completed_at",{ascending:!0});return r?(console.error("Error getting onboarding progress:",r),[]):(t||[]).map(s=>({step:s.step,completed_at:s.created_at||"",data:typeof s.data=="object"&&s.data!==null&&!Array.isArray(s.data)?s.data:{}}))}catch(t){return console.error("Error getting onboarding progress:",t),[]}}async markSplashScreensSeen(e){return this.updateOnboardingStatus(e,"initial",{splash_screens_seen:!0,timestamp:new Date().toISOString()})}async markProfileSetupComplete(e,t){try{const{error:r}=await d.from("users").update({has_profile_setup:!0,profile_data:Ee(t),updated_at:new Date().toISOString()}).eq("auth_user_id",e);return r?(console.error("Error marking profile setup complete:",r),!1):!0}catch(r){return console.error("Error marking profile setup complete:",r),!1}}async markWelcomeMessageShown(e){return this.updateOnboardingStatus(e,"complete",{welcome_message_shown:!0,timestamp:new Date().toISOString()})}async markOnboardingComplete(e){return this.updateOnboardingStatus(e,"complete",{onboarding_complete:!0,timestamp:new Date().toISOString()})}getBooleanValue(e,t=!1){return e==null?t:!!e}getNextOnboardingStepFromUser(e){const t=this.getBooleanValue(e.hasSeenSplashScreens),r=this.getBooleanValue(e.hasSeenHowToUse),s=this.getBooleanValue(e.hasSeenFeaturesConnected),n=this.getBooleanValue(e.hasSeenProFeatures),o=this.getBooleanValue(e.pcConnected),i=this.getBooleanValue(e.pcConnectionSkipped);return t?t&&!r?"how-to-use":r&&o&&!s?"features-connected":r&&!o&&i&&!n?"pro-features":r&&!o&&!i?"how-to-use":s&&!n?"pro-features":n?"complete":(console.error("🎯 [OnboardingService] ERROR: Unexpected onboarding flow state",{hasSeenSplashScreens:t,hasSeenHowToUse:r,hasSeenFeaturesConnected:s,hasSeenProFeatures:n,pcConnected:o,pcConnectionSkipped:i}),"how-to-use"):"initial"}async getNextOnboardingStep(e){try{const t=await this.getOnboardingStatus(e);if(!t)return"login";const r=this.getBooleanValue(t.has_seen_splash_screens),s=this.getBooleanValue(t.has_seen_how_to_use),n=this.getBooleanValue(t.has_seen_features_connected),o=this.getBooleanValue(t.has_seen_pro_features),i=this.getBooleanValue(t.pc_connected),c=this.getBooleanValue(t.pc_connection_skipped);return r?r&&!s?"how-to-use":s&&i&&!n?"features-connected":s&&!i&&c&&!o?"pro-features":s&&!i&&!c?"how-to-use":n&&!o?"pro-features":o?"complete":(console.error("🎯 [OnboardingService] ERROR: Unexpected onboarding flow state",{hasSeenSplashScreens:r,hasSeenHowToUse:s,hasSeenFeaturesConnected:n,hasSeenProFeatures:o,pcConnected:i,pcConnectionSkipped:c}),"how-to-use"):"initial"}catch(t){return console.error("🎯 [OnboardingService] Error getting next onboarding step:",t),"login"}}async shouldShowOnboarding(e){try{const t=await this.getOnboardingStatus(e);return t?!t.onboarding_completed:!0}catch(t){return console.error("Error checking if should show onboarding:",t),!0}}async trackOnboardingStep(e,t,r,s={}){try{await d.from("user_analytics").insert({user_id:e,auth_user_id:e,event_type:"onboarding_step",event_data:Ee({step:t,action:r,data:s,timestamp:new Date().toISOString()})})}catch(n){console.error("Error tracking onboarding step:",n)}}async trackOnboardingDropOff(e,t,r,s={}){try{await d.from("user_analytics").insert({user_id:e,auth_user_id:e,event_type:"onboarding_dropoff",event_data:Ee({step:t,reason:r,data:s,timestamp:new Date().toISOString()})})}catch(n){console.error("Error tracking onboarding dropoff:",n)}}async resetOnboarding(e){try{const{error:t}=await d.from("onboarding_progress").delete().eq("user_id",e);if(t)return console.error("Error clearing onboarding progress:",t),!1;const{error:r}=await d.from("users").update({is_new_user:!0,has_seen_splash_screens:!1,has_profile_setup:!1,has_welcome_message:!1,onboarding_completed:!1,onboarding_data:{}}).eq("id",e);return r?(console.error("Error resetting user onboarding flags:",r),!1):!0}catch(t){return console.error("Error resetting onboarding:",t),!1}}async getOnboardingStats(){try{const{count:e}=await d.from("users").select("*",{count:"exact",head:!0}),{count:t}=await d.from("users").select("*",{count:"exact",head:!0}).eq("onboarding_completed",!0),{data:r}=await d.from("user_analytics").select("event_data").eq("event_type","onboarding_dropoff"),s={};return r&&r.forEach(n=>{const o=n.event_data;if(typeof o=="object"&&o!==null&&!Array.isArray(o)){const i=o.step;typeof i=="string"&&(s[i]=(s[i]||0)+1)}}),{total_users:e||0,completed_onboarding:t||0,dropoff_by_step:s}}catch(e){return console.error("Error getting onboarding stats:",e),{total_users:0,completed_onboarding:0,dropoff_by_step:{}}}}};S(J,"instance");let Pe=J;const Ot=Pe.getInstance(),rs=Object.freeze(Object.defineProperty({__proto__:null,onboardingService:Ot},Symbol.toStringTag,{value:"Module"}));let v=null;const It="wss://otakon-relay.onrender.com";let oe=0;const Rt=5e3,Me=[];let _e=null,T=null,D=null,ve=!0;const Nt=3e4,kt=(a,e,t,r,s)=>{if(v&&(v.readyState===WebSocket.OPEN||v.readyState===WebSocket.CONNECTING))return;if(!/^\d{6}$/.test(a)){const o="Invalid code format. Please enter a 6-digit code.";r(o),ae.error(o);return}_e=a,T={onOpen:e,onMessage:t,onError:r,onClose:s},ve=!0;const n=`${It}/${a}`;try{v=new WebSocket(n)}catch(o){const c=`Connection failed: ${o instanceof Error?o.message:"An unknown error occurred."}. Please check the URL and your network connection.`;r(c),ae.error("PC connection failed. Please check your network and try again.");return}v.onopen=()=>{console.log("🔗 [WebSocket] Connection opened successfully to",n),oe=0,T&&typeof T.onOpen=="function"&&T.onOpen();try{v==null||v.send(JSON.stringify({type:"connection_request",code:a,ts:Date.now()})),console.log("🔗 [WebSocket] Sent connection_request with code:",a)}catch(o){console.error("🔗 [WebSocket] Failed to send connection_request:",o)}for(;Me.length&&v&&v.readyState===WebSocket.OPEN;){const o=Me.shift();try{v.send(JSON.stringify(o)),console.log("🔗 [WebSocket] Sent queued message:",o==null?void 0:o.type)}catch(i){console.error("🔗 [WebSocket] Failed to send queued message:",i)}}D&&(clearInterval(D),D=null),D=window.setInterval(()=>{if(v&&v.readyState===WebSocket.OPEN)try{v.send(JSON.stringify({type:"ping",ts:Date.now()}))}catch{}},Nt)},v.onmessage=o=>{var i;try{const c=JSON.parse(o.data);if(console.log("🔗 [WebSocket] Message received:",{type:c.type||"unknown",hasDataUrl:!!c.dataUrl,dataUrlLength:(i=c.dataUrl)==null?void 0:i.length,keys:Object.keys(c)}),c.type==="error"||c.error){const l=c.message||c.error||"Connection failed";console.error("🔗 [WebSocket] Server error:",l),localStorage.removeItem("otakon_connection_code"),localStorage.removeItem("otakon_last_connection"),T&&typeof T.onError=="function"&&T.onError(l);return}if(c.type==="no_partner"||c.type==="partner_not_found"||c.type==="invalid_code"){const l="No PC client found with this code. Please check the code and ensure the PC client is running.";console.error("🔗 [WebSocket] No partner found:",c),localStorage.removeItem("otakon_connection_code"),localStorage.removeItem("otakon_last_connection"),T&&typeof T.onError=="function"&&T.onError(l);return}if((c.type==="partner_disconnected"||c.type==="partner_left"||c.type==="peer_disconnected")&&console.log("🔗 [WebSocket] Partner disconnected - PC app closed or lost connection"),(c.type==="screenshot_success"||c.type==="screenshot_batch"||c.type==="screenshot")&&console.log("🔗 [WebSocket] Full screenshot message:",JSON.stringify(c).substring(0,500)),T&&typeof T.onMessage=="function"){console.log("🔗 [WebSocket] Invoking onMessage handler with data:",c.type);try{T.onMessage(c),console.log("🔗 [WebSocket] Handler completed successfully")}catch(l){console.error("🔗 [WebSocket] Handler threw error:",l)}}else console.error("🔗 [WebSocket] No valid onMessage handler!",T)}catch(c){console.error("🔗 [WebSocket] Failed to parse message:",o.data,c)}},v.onerror=()=>{},v.onclose=o=>{if(console.log("🔗 [WebSocket] Connection closed:",{wasClean:o.wasClean,code:o.code,reason:o.reason}),!o.wasClean){let i="Connection closed unexpectedly.";o.code===1006?(i="Connection to the server failed. Please check your network, verify the code, and ensure the PC client is running.",oe===0&&ae.warning("PC connection lost. Attempting to reconnect...")):o.reason&&(i=`Connection closed: ${o.reason}`),T&&typeof T.onError=="function"&&T.onError(i)}if(v=null,T&&typeof T.onClose=="function"&&T.onClose(),D&&(clearInterval(D),D=null),ve&&_e&&T){oe+=1;const i=Math.min(Rt,500*Math.pow(2,oe-1)),c=Math.random()*300,l=i+c;setTimeout(()=>{!v&&T&&ve&&kt(_e,T.onOpen,T.onMessage,T.onError,T.onClose)},l)}}},ss=a=>{v&&v.readyState===WebSocket.OPEN?v.send(JSON.stringify(a)):Me.push(a)},as=()=>{ve=!1,v&&(v.close(1e3,"User disconnected"),v=null),oe=0,D&&(clearInterval(D),D=null),_e=null,T=null},ns=(a,e,t,r)=>{T={onOpen:a,onMessage:e,onError:t,onClose:r},console.log("🔗 [WebSocket] Handlers updated")};class os{static async addToWaitlist(e,t="landing_page"){try{const{data:r,error:s}=await d.from("waitlist").insert({email:e,source:t,status:"pending"}).select();if(s){if(console.error("Error adding to waitlist:",s),console.error("Insert error details:",{message:s.message,code:s.code,details:s.details,hint:s.hint}),s.code==="23505")return{success:!0,alreadyExists:!0,error:"You're already on our waitlist! We'll email you when access is ready."};const{data:n,error:o}=await d.from("waitlist").select("email, status, created_at").eq("email",e).maybeSingle();return o?(console.error("Error checking existing email:",o),{success:!1,error:`Failed to add to waitlist: ${s.message}`}):n?{success:!0,alreadyExists:!0,error:"You're already on our waitlist! We'll email you when access is ready."}:{success:!1,error:`Failed to add to waitlist: ${s.message}`}}return{success:!0,alreadyExists:!1,error:void 0}}catch(r){return console.error("Waitlist service error:",r),{success:!1,error:"An unexpected error occurred"}}}static async getWaitlistCount(){try{const{count:e,error:t}=await d.from("waitlist").select("*",{count:"exact",head:!0});return t?(console.error("Error getting waitlist count:",t),{error:"Failed to get count"}):{count:e||0}}catch(e){return console.error("Error getting waitlist count:",e),{error:"Failed to get count"}}}static async getWaitlistStats(){try{const{data:e,error:t}=await d.from("waitlist").select("status");if(t)return console.error("Error fetching waitlist stats:",t),{total:137,pending:137,invited:0,converted:0};const r={total:e.length,pending:0,invited:0,converted:0};return e.forEach(s=>{const n=s.status||"pending";n==="pending"?r.pending++:n==="approved"?r.invited++:n==="rejected"&&r.converted++}),r}catch(e){return console.error("Error fetching waitlist stats:",e),{total:137,pending:137,invited:0,converted:0}}}}class q{static get(e,t){try{const r=localStorage.getItem(e);return r?JSON.parse(r):t}catch(r){return console.error(`Error getting ${e} from localStorage:`,r),t}}static set(e,t){try{localStorage.setItem(e,JSON.stringify(t))}catch(r){console.error(`Error setting ${e} in localStorage:`,r)}}static remove(e){try{localStorage.removeItem(e)}catch(t){console.error(`Error removing ${e} from localStorage:`,t)}}static clear(){try{localStorage.clear()}catch(e){console.error("Error clearing localStorage:",e)}}}class Gt{constructor(){S(this,"CONVERSATION_TTL",720*60*60*1e3);S(this,"CONTEXT_TTL",1440*60*1e3)}async saveConversation(e,t){const r=`conversation:${e.id}`;await R.set(r,e,this.CONVERSATION_TTL,"conversation",t)}async loadConversation(e){const t=`conversation:${e}`;return await R.get(t)}async saveChatContext(e,t){await R.setChatContext(e,t)}async loadChatContext(e){return await R.getChatContext(e)}async saveUserMemory(e,t){await R.setUserMemory(e,t)}async loadUserMemory(e){return await R.getUserMemory(e)}async saveConversationSummary(e,t){const r=`conversation_summary:${e}`;await R.set(r,t,this.CONTEXT_TTL)}async loadConversationSummary(e){const t=`conversation_summary:${e}`;return await R.get(t)}async saveGameContext(e,t,r){await R.setGameContext(e,t,r)}async loadGameContext(e,t){return await R.getGameContext(e,t)}async getUserConversations(e){return[]}async clearUserChatData(e){await R.clearUserCache(e)}}const Pt=new Gt,we=new Map,ne=new Map,Mt=1800*1e3,nt="otagon_igdb_cache",De=1440*60*1e3,ot="otagon_cover_urls";function Dt(){try{const a=localStorage.getItem(nt);if(a){const e=JSON.parse(a);if(e.version===1&&Date.now()-e.timestamp<De){for(const[t,r]of Object.entries(e.games))Date.now()-r.timestamp<De&&ne.set(t,r);console.log("[IGDBService] Loaded",ne.size,"games from localStorage cache")}}}catch(a){console.warn("[IGDBService] Error loading localStorage cache:",a)}}function Ut(){try{const a={};ne.forEach((t,r)=>{a[r]=t});const e={version:1,timestamp:Date.now(),games:a};localStorage.setItem(nt,JSON.stringify(e))}catch(a){console.warn("[IGDBService] Error saving localStorage cache:",a)}}function xt(){try{const a=localStorage.getItem(ot);if(a){const e=JSON.parse(a);if(e.version===1&&Date.now()-e.timestamp<De)return console.log("[IGDBService] Loaded",Object.keys(e.urls).length,"cover URLs from localStorage"),new Map(Object.entries(e.urls))}}catch(a){console.warn("[IGDBService] Error loading cover URL cache:",a)}return new Map}function it(a){try{const e={version:1,timestamp:Date.now(),urls:Object.fromEntries(a)};localStorage.setItem(ot,JSON.stringify(e))}catch(e){console.warn("[IGDBService] Error saving cover URL cache:",e)}}Dt();const le=xt();function Be(a,e="cover_small"){if(!a)return;let t=a;return t=t.replace(/t_(thumb|cover_small|cover_big|720p|1080p|screenshot_huge)/g,`t_${e}`),t.startsWith("//")?t="https:"+t:t.startsWith("http")||(t="https://"+t),t}function is(a){var e;if((e=a==null?void 0:a.cover)!=null&&e.url)return Be(a.cover.url,"cover_small")}async function Lt(a){if(!a||a.trim().length===0)return console.warn("[IGDBService] Empty game name provided"),null;const e=a.toLowerCase().trim(),t=ne.get(e);if(t&&Date.now()-t.timestamp<Mt)return console.log("[IGDBService] Session cache hit:",a),t.data;if(we.has(e)){console.log("[IGDBService] Waiting for pending request:",a);const s=we.get(e);if(s)return s}const r=(async()=>{var s,n,o;try{console.log("[IGDBService] Fetching game data:",a);const{data:{session:i}}=await d.auth.getSession(),c={"Content-Type":"application/json"};i!=null&&i.access_token&&(c.Authorization=`Bearer ${i.access_token}`),console.log("[IGDBService] Invoking igdb-proxy with gameName:",a);const l=await d.functions.invoke("igdb-proxy",{body:JSON.stringify({gameName:a}),headers:c});if(l.error){console.error("[IGDBService] Edge function error:",l.error);const p=l.error;return((s=p==null?void 0:p.message)!=null&&s.includes("IGDB_NOT_CONFIGURED")||(n=p==null?void 0:p.message)!=null&&n.includes("503"))&&console.warn("[IGDBService] IGDB service not configured - game data will not be available"),null}const u=l.data;if((u==null?void 0:u.code)==="IGDB_NOT_CONFIGURED")return console.warn("[IGDBService] IGDB service not configured on server"),null;if(!u.success||!u.data)return console.log("[IGDBService] No data found for:",a),null;const m=u.data;if(ne.set(e,{data:m,timestamp:Date.now()}),Ut(),(o=m.cover)!=null&&o.url){const p=Be(m.cover.url,"cover_small");p&&(le.set(e,p),it(le),console.log("[IGDBService] Saved cover URL to cache:",e))}return console.log("[IGDBService] Successfully fetched:",m.name,u.cached?"(cached)":"(fresh)"),m}catch(i){return console.error("[IGDBService] Error fetching game data:",i),null}finally{we.delete(e)}})();return we.set(e,r),r}async function cs(a){return Lt(`id:${a}`)}async function ls(a){if(!a||a.trim().length<2)return[];try{console.log("[IGDBService] Searching games:",a);const{data:{session:e}}=await d.auth.getSession(),t={"Content-Type":"application/json"};e!=null&&e.access_token&&(t.Authorization=`Bearer ${e.access_token}`);const r=await d.functions.invoke("igdb-proxy",{body:JSON.stringify({gameName:a,searchMode:"multi"}),headers:t});if(r.error)return console.error("[IGDBService] Search error:",r.error),[];const s=r.data;if(!s.success||!s.data)return[];const n=s.data;console.log("[IGDBService] Search found",n.length,"games");for(const o of n){const i=o.name.toLowerCase().trim();ne.set(i,{data:o,timestamp:Date.now()})}return n}catch(e){return console.error("[IGDBService] Search error:",e),[]}}function us(a,e="high"){return`https://img.youtube.com/vi/${a}/${{default:"default",medium:"mqdefault",high:"hqdefault",maxres:"maxresdefault"}[e]}.jpg`}function ds(a){return{1:"Official",2:"Wikia",3:"Wikipedia",4:"Facebook",5:"Twitter",6:"Twitch",8:"Instagram",9:"YouTube",10:"iPhone",11:"iPad",12:"Android",13:"Steam",14:"Reddit",15:"Itch.io",16:"Epic Games",17:"GOG",18:"Discord"}[a]||"Website"}function gs(a,e){return a===1?{6:"RP (Rating Pending)",7:"EC (Early Childhood)",8:"E (Everyone)",9:"E10+ (Everyone 10+)",10:"T (Teen)",11:"M (Mature 17+)",12:"AO (Adults Only)"}[e]||"Not Rated":a===2&&{1:"PEGI 3",2:"PEGI 7",3:"PEGI 12",4:"PEGI 16",5:"PEGI 18"}[e]||"Not Rated"}function ms(a){return a?new Date(a*1e3).toLocaleDateString("en-US",{year:"numeric",month:"long",day:"numeric"}):"TBA"}function hs(a){return a?a.filter(e=>e.developer).map(e=>e.company.name):[]}function ps(a){return a.total_rating??a.aggregated_rating??a.rating??null}async function fs(a){var s;const e=new Map;if(a.length===0)return e;const t=a.map(n=>n.toLowerCase().trim()),r=[];for(const n of t){const o=le.get(n);o?e.set(n,o):r.push(n)}if(r.length===0)return console.log("[IGDBService] All cover URLs from localStorage cache:",e.size),e;try{const{data:n,error:o}=await d.from("igdb_game_cache").select("game_name_key, game_data").in("game_name_key",r).gt("expires_at",new Date().toISOString());if(o)return console.warn("[IGDBService] Error fetching cover URLs from cache:",o.message),e;if(n){for(const i of n){const c=i.game_data;if((s=c==null?void 0:c.cover)!=null&&s.url){const l=Be(c.cover.url,"cover_small");l&&(e.set(i.game_name_key,l),le.set(i.game_name_key,l))}}it(le)}console.log("[IGDBService] Fetched cover URLs:",e.size,"of",a.length,"(",e.size-r.length+((n==null?void 0:n.length)??0),"from localStorage,",(n==null?void 0:n.length)||0,"from Supabase)")}catch(n){console.warn("[IGDBService] Error in fetchCoverUrlsFromCache:",n)}return e}const Ss=a=>{const e=new Map;let t=a.replace(/\\\*/g,"*");t=t.replace(/\*\*\s*Hint\s*:\*\*\s*/gi,`

Hint:
`),t=t.replace(/\*\*\s*Lore\s*:\*\*\s*/gi,`

Lore:
`),t=t.replace(/\*\*\s*Places\s+of\s+Interest\s*:\*\*\s*/gi,`

Places of Interest:
`),t=t.replace(/\*\*\s*Strategy\s*:\*\*\s*/gi,`

Strategy:
`),t=t.replace(/\*\*\s*What\s+to\s+focus\s+on\s*:\*\*\s*/gi,`

What to focus on:
`),t=t.replace(/\n\*\*\s*Hint\s*:\s*\n/gi,`

Hint:
`),t=t.replace(/\n\*\*\s*Lore\s*:\s*\n/gi,`

Lore:
`),t=t.replace(/\n\*\*\s*Places\s+of\s+Interest\s*:\s*\n/gi,`

Places of Interest:
`),t=t.replace(/\n\*\*\s*Strategy\s*:\s*\n/gi,`

Strategy:
`),t=t.replace(/\n\*\*\s*What\s+to\s+focus\s+on\s*:\s*\n/gi,`

What to focus on:
`),t=t.replace(/^\*\*\s*Hint\s*:\s*\**\s*$/gim,"Hint:"),t=t.replace(/^\*\*\s*Lore\s*:\s*\**\s*$/gim,"Lore:"),t=t.replace(/^\*\*\s*Places\s+of\s+Interest\s*:\s*\**\s*$/gim,"Places of Interest:"),t=t.replace(/^\*\*\s*Strategy\s*:\s*\**\s*$/gim,"Strategy:"),t=t.replace(/^\*\*\s*What\s+to\s+focus\s+on\s*:\s*\**\s*$/gim,"What to focus on:"),t=t.replace(/\*\*\s+([^*]+?)\*\*/g,"**$1**"),t=t.replace(/\*\*([^*]+?)\s+\*\*/g,"**$1**"),t=t.replace(/\*\*\s*([A-Za-z ]+?)\s*:\s*\*\*/g,"**$1:**"),t=t.replace(/\*\*([^*\n]+)\n\*\*/g,`**$1**
`),t=t.replace(/###\s*\*\*\s*/g,"### "),t=t.replace(/##\s*\*\*\s*/g,"## "),t=t.replace(/^\*\*\s*$/gm,""),t=t.replace(/\n\*\*\s*\n/g,`

`),t=t.replace(/\*\*\s+Release\s+Date\s*:\s*\*\*/gi,"**Release Date:**"),t=t.replace(/\*\*\s+The\s+Verdict\s*:\s*\*\*/gi,"**The Verdict:**"),t=t.replace(/\*\*\s+Key\s+Features\s*:\s*\*\*/gi,"**Key Features:**"),t=t.replace(/\*\*\s+([A-Za-z][A-Za-z\s]+?)(?=\s+(?:is|are|was|were|has|have|and|or|but|the|a|an|of|to|in|on|at|for|with|as|by|from|serves?|often|usually)\s)/gi,"$1"),t=t.replace(/(\b[A-Za-z]+)\s*\*\*(?=,|\s|\.)/g,"$1"),t=t.replace(/\*\*\s*([^*\n]{3,}?)([.!?])(?!\*\*)/g,"$1$2"),(t.match(/\*\*/g)||[]).length%2!==0&&(t=t.replace(/\*\*\s*$/g,""),t=t.replace(/^\s*\*\*/g,""),t=t.replace(/\s\*\*\s+([A-Z])/g," $1"),t=t.replace(/(\w)\*\*(?=[\s,.])/g,"$1")),console.log(`🏷️ [otakonTags] Parsing response (${a.length} chars)...`),["Hint","Lore","Places of Interest"].forEach(h=>{if(a.includes(h)){const g=a.substring(Math.max(0,a.indexOf(h)-10),a.indexOf(h)+h.length+20);console.log(`🔍 [otakonTags] Found "${h}" pattern: "${g}"`)}});const n=/\[OTAKON_SUGGESTIONS:\s*(\[[\s\S]*?\])\s*\]/g;let o;for(;(o=n.exec(a))!==null;)try{const h=o[1].replace(/'/g,'"'),g=JSON.parse(h);e.set("SUGGESTIONS",g),t=t.replace(o[0],""),console.log("🏷️ [otakonTags] Extracted SUGGESTIONS:",g)}catch{console.warn("[OtakonTags] Failed to parse SUGGESTIONS JSON:",o[1])}const i=/\[OTAKON_SUBTAB_UPDATE:\s*(\{[\s\S]*?\})\s*\]/g;let c;const l=[];for(;(c=i.exec(a))!==null;)try{const h=JSON.parse(c[1]);l.push(h),t=t.replace(c[0],"")}catch{console.warn("[OtakonTags] Failed to parse SUBTAB_UPDATE JSON:",c[1])}l.length>0&&e.set("SUBTAB_UPDATE",l);const u=/\[OTAKON_([A-Z_]+):\s*([^[\]]+?)\]/g;let m,p=null;const f=a.match(/\[OTAKON_PROGRESS[:\s]+(\d+)/i);if(f&&(p=parseInt(f[1],10),console.log(`📊 [otakonTags] Found OTAKON_PROGRESS format: ${f[0]} → ${p}%`)),!p){const h=a.match(/\[?PROGRESS[:\s]+(\d+)/i);h&&(p=parseInt(h[1],10),console.log(`📊 [otakonTags] Found PROGRESS format: ${h[0]} → ${p}%`))}if(!p){const h=a.match(/(?:progress|completion|game progress)[:\s]+(?:approximately\s+)?(\d+)\s*%/i);h&&(p=parseInt(h[1],10),console.log(`📊 [otakonTags] Found inline progress format: ${h[0]} → ${p}%`))}if(!p){const h=a.match(/"stateUpdateTags"[^}]*"PROGRESS[:\s]+(\d+)/i);h&&(p=parseInt(h[1],10),console.log(`📊 [otakonTags] Found stateUpdateTags PROGRESS: ${h[0]} → ${p}%`))}for(p!==null&&p>=0&&p<=100?(e.set("PROGRESS",p),console.log(`📊 [otakonTags] ✅ Set PROGRESS tag to: ${p}%`)):console.log("📊 [otakonTags] ⚠️ No valid progress found in response");(m=u.exec(a))!==null;){const h=m[1];let g=m[2].trim();if(console.log(`🏷️ [otakonTags] Found tag: ${h} = ${m[2].substring(0,50)}`),!(h==="SUGGESTIONS"||h==="SUBTAB_UPDATE")){try{const _=g;_.startsWith("{")&&_.endsWith("}")&&(g=JSON.parse(_)),_.startsWith("[")&&_.endsWith("]")&&(g=JSON.parse(_.replace(/'/g,'"')))}catch{}if(h==="PROGRESS"){const _=String(g).trim(),N=_.match(/(\d+)/);if(N){const U=parseInt(N[1],10);g=Math.min(100,Math.max(0,U)),console.log(`📊 [otakonTags] Parsed PROGRESS: "${_}" → ${g}`)}else console.warn(`📊 [otakonTags] Could not parse PROGRESS value: "${_}"`)}e.set(h,g),t=t.replace(m[0],"")}}t=t.replace(/\[OTAKON_[A-Z_]+:[^\]]*\]/g,"").replace(/^["'][^"']*\?["']\s*,?\s*/gm,"").replace(/^["'](?:and\s+)?\[\d+\][^"']*\?["']\s*,?\s*/gim,"").replace(/^["'][^"']*\?["']\s*\]\s*/gm,"").replace(/^[^"']*\?["']\s*\]\s*/gm,"").replace(/^(?:["'][^"']*["']\s*,?\s*)+\]/g,"");const C=["Hint","Lore","Places of Interest","Strategy","What to focus on"];for(const h of C){const g=h.replace(/ /g,"\\s+"),_=new RegExp(`\\*+\\s*${g}(?:\\s*[:\\*]+\\s*:?|\\s*:)\\s*\\**|\\*\\*\\s*${g}\\s*\\*\\*|\\*\\*\\s+${g}(?![:\\w*])`,"gi");t=t.replace(_,`

${h}:
`),t=t.replace(new RegExp(`(?:^|\\n)\\s*${g}:\\s*`,"gi"),`

${h}:
`)}t=t.replace(/:{2,}/g,":"),t=t.replace(/\*\*\s+([^*\n]+?)\*\*/g,"**$1**").replace(/\*\*([^*\n]+?)\s+\*\*/g,"**$1**");for(const h of C){const g=h.replace(/ /g,"\\s+");t=t.replace(new RegExp(`([.!?\\w])([\\s\\n]*)${g}:\\s*`,"gi"),`$1$2

**${h}:**

`),t=t.replace(new RegExp(`^\\s*${g}:\\s*`,"i"),`**${h}:**

`),t=t.replace(new RegExp(`\\n\\s*${g}:\\s*`,"gi"),`

**${h}:**

`)}return console.log(`🔍 [otakonTags] After Phase 3 - Hint bold: ${t.includes("**Hint:**")}, Lore bold: ${t.includes("**Lore:**")}, Places bold: ${t.includes("**Places of Interest:**")}`),t=t.replace(/^\s*\*\*\s*$/gm,"").replace(/^\*\*\s*\n/gm,`
`).replace(/([a-z])\*\*\s+([A-Z])/g,"$1 $2").replace(/([^:])\*\*\s*$/gm,"$1").replace(/^Hint:\s*\n\s*Hint:\s*/gm,`**Hint:**

`).replace(/\]\s*$/gm,"").replace(/^\s*\]/gm,"").replace(/\[\s*$/gm,"").replace(/^\s*\[/gm,"").replace(/\s+\]\s+/g," ").replace(/\s+\[\s+/g," ").replace(/\.\s*(\d+\.\s*\*\*)/g,`.

$1`).replace(/\.\s*(\d+\.\s+[A-Z])/g,`.

$1`).replace(/^(\d+)\.([A-Z])/gm,"$1. $2").replace(/([^htfps*]):([A-Z])/g,"$1: $2"),t=t.replace(/\*\*([^*]+)\*\*([A-Za-z])/g,"**$1** $2").replace(/([a-z])\*\*([A-Z])/g,"$1 **$2").replace(/([a-z])([A-Z][a-z]{2,})/g,(h,g,_)=>["PlayStation","GamePass","GameStop","YouTube","OpenWorld"].some(U=>(g+_).includes(U))?h:g+" "+_).replace(/\b(like|or|and|the|a|an|for|with|from|to|in|on|at|by|as)([A-Z])/g,"$1 $2"),t=t.replace(/\*\*\s*\*\*/g,"").replace(/\n{3,}/g,`

`).replace(/^\s+|\s+$/g,"").trim(),t=t.replace(/\*\*\s+(Hint|Lore|Strategy):\*\*/gi,"**$1:**").replace(/\*\*\s+Places\s+of\s+Interest:\*\*/gi,"**Places of Interest:**").replace(/\*\*\s+What\s+to\s+focus\s+on:\*\*/gi,"**What to focus on:**"),e.size>0&&console.log(`🏷️ [otakonTags] Extracted ${e.size} tags:`,Array.from(e.keys()).join(", ")),{cleanContent:t,tags:e}},X=class X{static getInstance(){return X.instance||(X.instance=new X),X.instance}generateCacheKey(e,t){var o;const r={prompt:e.trim().toLowerCase(),gameTitle:(o=t.gameTitle)==null?void 0:o.toLowerCase(),mode:t.mode},s=JSON.stringify(r);let n=0;for(let i=0;i<s.length;i++){const c=s.charCodeAt(i);n=(n<<5)-n+c,n=n&n}return Math.abs(n).toString(36)}async getCachedResponse(e){try{const{data:t,error:r}=await d.from("ai_responses").select("response_data, created_at, model_used, tokens_used, cache_type").eq("cache_key",e).gt("expires_at",new Date().toISOString()).single();if(r)return r.code==="PGRST116"?(console.log("❌ [aiCacheService] Cache MISS:",e.substring(0,8)),null):(console.error("❌ [aiCacheService] Error checking cache:",r),null);if(t){const s=t.created_at?Math.floor((Date.now()-new Date(t.created_at).getTime())/1e3/60):0;return console.log("✅ [aiCacheService] Cache HIT:",e.substring(0,8),{age:`${s}m`,model:t.model_used,tokens:t.tokens_used,type:t.cache_type}),t.response_data}return null}catch(t){return console.error("Error in getCachedResponse:",t),null}}async cacheResponse(e,t,r){try{const s=new Date;s.setHours(s.getHours()+r.ttlHours);const{data:{user:n}}=await d.auth.getUser(),{error:o}=await d.from("ai_responses").upsert({cache_key:e,response_data:JSON.parse(JSON.stringify(t)),game_title:r.gameTitle,cache_type:r.cacheType,conversation_id:r.conversationId,model_used:r.modelUsed,tokens_used:r.tokensUsed,user_id:n==null?void 0:n.id,expires_at:s.toISOString(),created_at:new Date().toISOString()},{onConflict:"cache_key"});return o?(console.error("Error caching response:",o),!1):(console.log("💾 Cached response:",e.substring(0,8),{type:r.cacheType,ttl:r.ttlHours+"h",tokens:r.tokensUsed,game:r.gameTitle}),!0)}catch(s){return console.error("Error in cacheResponse:",s),!1}}determineCacheType(e){return e.gameTitle?"game_specific":e.hasUserContext||e.conversationId?"user":"global"}determineTTL(e,t){switch(e){case"global":return 168;case"game_specific":return 24;case"user":return 12;default:return 24}}shouldCache(e,t){if(console.log(`🔍 [aiCacheService] shouldCache called with prompt: "${e.substring(0,50)}..."`,t),t.noCache===!0)return!1;if(e.trim().length<10)return console.log(`❌ [aiCacheService] Not caching: prompt too short (${e.trim().length} chars)`),!1;const r=["today","now","current","latest","recent","just released"],s=e.toLowerCase();return!r.find(o=>s.includes(o))}async cleanupExpiredCache(){try{const{data:e,error:t}=await d.from("ai_responses").delete().lt("expires_at",new Date().toISOString()).select("id");return t?(console.error("Error cleaning up cache:",t),{deleted:0}):{deleted:(e==null?void 0:e.length)||0}}catch(e){return console.error("Error in cleanupExpiredCache:",e),{deleted:0}}}async getCacheStats(){try{const{data:e,error:t}=await d.from("ai_responses").select("cache_type, tokens_used").gt("expires_at",new Date().toISOString());if(t)return console.error("Error getting cache stats:",t),{totalEntries:0,byType:{},totalTokensSaved:0};const r={totalEntries:e.length,byType:{},totalTokensSaved:e.reduce((s,n)=>s+(n.tokens_used||0),0)};return e.forEach(s=>{const n=s.cache_type||"unknown";r.byType[n]=(r.byType[n]||0)+1}),r}catch(e){return console.error("Error in getCacheStats:",e),{totalEntries:0,byType:{},totalTokensSaved:0}}}async invalidateGameCache(e){try{const{error:t}=await d.from("ai_responses").delete().eq("game_title",e).eq("cache_type","game_specific");return t?(console.error("Error invalidating game cache:",t),!1):!0}catch(t){return console.error("Error in invalidateGameCache:",t),!1}}};S(X,"instance");let Ue=X;const ys=Ue.getInstance(),Z=class Z{constructor(){}static getInstance(){return Z.instance||(Z.instance=new Z),Z.instance}generateProfileSpecificTabs(e,t){const r=[];return e.playerFocus==="Story-Driven"&&r.push({id:"narrative_themes",title:"Narrative Themes",type:"story",priority:"high",isProfileSpecific:!0,instruction:this.getNarrativeThemesInstruction(e.hintStyle)}),e.playerFocus==="Completionist"&&r.push({id:"secret_hunting",title:"Secret Hunting",type:"tips",priority:"high",isProfileSpecific:!0,instruction:this.getSecretHuntingInstruction(e.hintStyle)}),e.playerFocus==="Strategist"&&r.push({id:"optimization_guide",title:"Optimization Guide",type:"strategies",priority:"high",isProfileSpecific:!0,instruction:this.getOptimizationInstruction(e.hintStyle)}),t!=null&&t.playthroughCount&&t.playthroughCount>1&&r.push({id:"playthrough_comparison",title:"Playthrough Comparison",type:"tips",priority:"medium",isProfileSpecific:!0,instruction:this.getPlaythroughComparisonInstruction(e)}),r}getNarrativeThemesInstruction(e){const t={Cryptic:"Provide subtle hints about story themes without revealing major plot points. Use metaphorical language and thematic connections.",Balanced:"Discuss narrative elements with moderate detail, balancing spoiler avoidance with meaningful insight into themes and character arcs.",Direct:"Explain story themes clearly while maintaining appropriate spoiler warnings. Provide direct analysis of narrative elements encountered so far."};return t[e]||t.Balanced}getSecretHuntingInstruction(e){const t={Cryptic:"Give mysterious clues about hidden content locations. Use environmental riddles and subtle hints that require exploration.",Balanced:"Provide clear directions to secrets with some exploration challenge. Balance helpfulness with maintaining the joy of discovery.",Direct:"Give precise locations and requirements for finding secrets. Include step-by-step instructions and exact coordinates when helpful."};return t[e]||t.Balanced}getOptimizationInstruction(e){const t={Cryptic:"Suggest optimization strategies through hints and examples. Let the player discover the optimal path with guidance.",Balanced:"Provide balanced optimization advice with clear explanations. Suggest effective approaches while leaving room for experimentation.",Direct:"Give specific optimization recommendations with detailed steps. Provide exact stat allocations, builds, and strategies for maximum efficiency."};return t[e]||t.Direct}getPlaythroughComparisonInstruction(e){return`Compare different playthrough approaches based on ${e.playerFocus} style and ${e.hintStyle} preferences. Highlight what's different this time and suggest new strategies to explore.`}prioritizeTabsForProfile(e,t){return e.sort((r,s)=>{if(r.isProfileSpecific&&!s.isProfileSpecific)return-1;if(!r.isProfileSpecific&&s.isProfileSpecific)return 1;const n={high:3,medium:2,low:1};return n[s.priority]-n[r.priority]})}getHintStyleModifier(e){const t={Cryptic:"Use subtle, metaphorical hints. Avoid direct answers. Make the player think and discover.",Balanced:"Provide clear guidance while leaving room for exploration. Balance helpfulness with discovery.",Direct:"Give explicit, step-by-step instructions. Be precise and comprehensive in explanations."};return t[e]||t.Balanced}getPlayerFocusModifier(e){const t={"Story-Driven":"Emphasize narrative elements, character development, and story context. Prioritize lore and thematic content.",Completionist:"Focus on collectibles, hidden items, side quests, and 100% completion strategies. Highlight missable content.",Strategist:"Prioritize optimal strategies, build optimization, and efficient progression. Focus on mechanics and systems."};return t[e]||t.Strategist}getSpoilerToleranceModifier(e){const t={Strict:"NEVER mention future events, characters, or plot points. Only discuss content up to current progress.",Moderate:"You may hint at upcoming content in vague terms, but avoid specific spoilers.",Relaxed:"You can discuss future content more freely, but still mark major spoilers clearly."};return t[e]||t.Strict}getToneModifier(e){const t={Encouraging:"Use an enthusiastic, supportive tone. Celebrate achievements and provide positive reinforcement.",Professional:"Maintain a knowledgeable, respectful tone. Provide expertise without excessive casualness.",Casual:"Use a friendly, conversational tone. Feel free to use gaming terminology and be relaxed."};return t[e]||t.Professional}buildProfileContext(e){return[`Hint Style: ${this.getHintStyleModifier(e.hintStyle)}`,`Player Focus: ${this.getPlayerFocusModifier(e.playerFocus)}`,`Spoiler Tolerance: ${this.getSpoilerToleranceModifier(e.spoilerTolerance)}`,`Tone: ${this.getToneModifier(e.preferredTone)}`].join(`
`)}getDefaultProfile(){return{hintStyle:"Balanced",playerFocus:"Strategist",preferredTone:"Professional",spoilerTolerance:"Strict"}}};S(Z,"instance");let xe=Z;const H=xe.getInstance(),Ne=new Map;async function ct(a){const e=Ne.get(a);if(e)return await e,ct(a);let t=()=>{};const r=new Promise(s=>{t=s});return Ne.set(a,r),()=>{Ne.delete(a),t()}}const lt={responseHistoryScope:"game",applyCorrections:!0,correctionDefaultScope:"game"},Ve={aiCorrections:[],aiPreferences:lt,responseTopicsCache:{}},$t=20,Je=5,Xe=10;async function P(a){try{const{data:e,error:t}=await d.from("users").select("behavior_data").eq("auth_user_id",a).single();if(t)return console.error("[BehaviorService] Error fetching behavior_data:",t),Ve;const r=(e==null?void 0:e.behavior_data)||{};return{aiCorrections:r.aiCorrections||[],aiPreferences:{...lt,...r.aiPreferences},responseTopicsCache:r.responseTopicsCache||{}}}catch(e){return console.error("[BehaviorService] Exception fetching behavior_data:",e),Ve}}async function $(a,e){const t=await ct(a);try{const r=await P(a),s={...r,...e,aiPreferences:e.aiPreferences?{...r.aiPreferences,...e.aiPreferences}:r.aiPreferences},{error:n}=await d.from("users").update({behavior_data:s}).eq("auth_user_id",a);return n?(console.error("[BehaviorService] Error updating behavior_data:",n),!1):!0}catch(r){return console.error("[BehaviorService] Exception updating behavior_data:",r),!1}finally{t()}}async function Ft(a,e,t="game"){if(t==="off")return[];const r=await P(a);if(t==="global")return Object.values(r.responseTopicsCache).flat().slice(0,50);const s=e||"game-hub";return r.responseTopicsCache[s]||[]}async function Bt(a,e,t){if(!t.length)return;const r=await P(a),s=e||"game-hub",n=r.responseTopicsCache[s]||[],o=[...t,...n],i=[...new Set(o)].slice(0,$t);r.responseTopicsCache[s]=i,await $(a,{responseTopicsCache:r.responseTopicsCache})}async function Wt(a,e){const t=await P(a);if(e===void 0)await $(a,{responseTopicsCache:{}});else{const r=e||"game-hub";delete t.responseTopicsCache[r],await $(a,{responseTopicsCache:t.responseTopicsCache})}}async function Ht(a){return(await P(a)).aiPreferences}async function Kt(a,e){const t=await P(a);return $(a,{aiPreferences:{...t.aiPreferences,...e}})}async function qt(a,e=null,t=!0){return(await P(a)).aiCorrections.filter(s=>s.isActive?s.scope==="game"?s.gameTitle===e:t&&s.scope==="global":!1)}async function zt(a,e){const t=await P(a),r=t.aiCorrections.filter(i=>i.isActive&&i.scope==="game"&&i.gameTitle===e.gameTitle),s=t.aiCorrections.filter(i=>i.isActive&&i.scope==="global");if(e.scope==="game"&&r.length>=Je)return{success:!1,error:`Maximum ${Je} corrections per game reached`};if(e.scope==="global"&&s.length>=Xe)return{success:!1,error:`Maximum ${Xe} global corrections reached`};const n={...e,id:crypto.randomUUID(),isActive:!0,appliedCount:0,createdAt:new Date().toISOString()};return t.aiCorrections.push(n),{success:await $(a,{aiCorrections:t.aiCorrections})}}async function Yt(a,e,t){const r=await P(a),s=r.aiCorrections.find(n=>n.id===e);return s?(s.isActive=t,$(a,{aiCorrections:r.aiCorrections})):!1}async function jt(a,e){const t=await P(a);return t.aiCorrections=t.aiCorrections.filter(r=>r.id!==e),$(a,{aiCorrections:t.aiCorrections})}async function Vt(a,e){const t=await P(a),r=t.aiCorrections.find(s=>s.id===e);r&&(r.appliedCount++,await $(a,{aiCorrections:t.aiCorrections}))}const L={getBehaviorData:P,updateBehaviorData:$,getResponseTopics:Ft,addResponseTopics:Bt,clearResponseTopics:Wt,getAIPreferences:Ht,updateAIPreferences:Kt,getActiveCorrections:qt,addCorrection:zt,toggleCorrection:Yt,removeCorrection:jt,incrementCorrectionApplied:Vt};function Jt(a){const e=[];return a.interactionType==="suggested_prompt"?e.push(`
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
`)}function Xt(a,e){const t=[],r=(e==null?void 0:e.messageCount)||a.messages.length,s=a.gameProgress||0,n=(e==null?void 0:e.subtabsFilled)||0,o=(e==null?void 0:e.subtabsTotal)||0;if(a.isGameHub||r<3)return"";if(r>=20?t.push(`
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
`),o>0&&n>0){const i=n/o;i>=.8?t.push(`
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
`)}function Zt(a){if(!a||a.scope==="off")return"";const e=[];if(a.previousTopics.length>0&&e.push(`
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
`)}async function bs(a,e){try{const t=await L.getAIPreferences(a);if(t.responseHistoryScope==="off")return{previousTopics:[],corrections:[],scope:"off"};const[r,s]=await Promise.all([L.getResponseTopics(a,e,t.responseHistoryScope),L.getActiveCorrections(a,e,!0)]);return{previousTopics:r,corrections:s,scope:t.responseHistoryScope}}catch(t){return console.error("[PromptSystem] Error fetching behavior context:",t),null}}const Ze=500,Qt=15e3,Oe=`
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
`,Ie=`
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
`,We=`
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
`,Re=`
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
`,er=`
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
`,tr=a=>`
**Persona: General Gaming Assistant**
You are Otagon, a helpful and knowledgeable AI gaming assistant for the "Game Hub" tab.

**CRITICAL - RESPONSE BEHAVIOR:**
- NEVER start responses with self-introductions like "I am Otagon", "Hello! I'm Otagon", "As Otagon", or similar
- NEVER introduce yourself or state your name at the beginning of responses
- Jump directly into answering the user's question with helpful content
- Be conversational but focus on providing value immediately

${Oe}

${Ie}

${We}

**CRITICAL: Use Real Information**
- Today's date is ${new Date().toLocaleDateString("en-US",{month:"long",day:"numeric",year:"numeric"})}
- You have access to Google Search grounding for current information
- ALWAYS cite specific game titles, release dates, and accurate details from web search results
- NEVER use placeholders like "[Hypothetical Game A]", "[Insert Today's Date]", "[Game Title Here]"
- For questions about recent releases, new updates, or announcements, use the grounded web search data
- Your knowledge cutoff is January 2025 - use web search for anything after that date
- Always provide specific, real game titles and accurate information

**FALLBACK WHEN INFORMATION IS UNAVAILABLE:**
- If web search doesn't return results: "I couldn't find verified information about this. Please check the official source."
- If release date is uncertain: "The exact release date hasn't been confirmed yet" - NEVER invent a date
- If you're unsure about a game's features: "I'd recommend checking the game's official page for the most accurate details"
- If asked about a game you don't recognize: "I'm not familiar with that specific game. Could you tell me more about it or check the spelling?"

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

**IMPORTANT - When to use game tags:**
✅ User asks: "How do I beat the first boss in Elden Ring?" → Include [OTAKON_GAME_ID: Elden Ring] [OTAKON_CONFIDENCE: high] [OTAKON_GENRE: Action RPG]
✅ User asks: "What's the best build for Cyberpunk 2077?" → Include [OTAKON_GAME_ID: Cyberpunk 2077] [OTAKON_CONFIDENCE: high] [OTAKON_GENRE: Action RPG]
❌ User asks: "What's a good RPG to play?" → NO game tags (general question)
❌ User asks: "Tell me about open world games" → NO game tags (general question)

**Tag Definitions:**
${Re}

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
`,rr=(a,e,t,r,s)=>{var m,p;let n=0;const o=((m=a.subtabs)==null?void 0:m.filter(f=>f.status==="loaded"&&f.content).map(f=>{const C=f.content||"",h=C.length>Ze?"..."+C.slice(-Ze):C,g=`### ${f.title} (ID: ${f.id})
${h}`;return n+=g.length,n>Qt?null:g}).filter(Boolean).join(`

`))||"No subtabs available yet.",i=a.messages.slice(-10).map(f=>`${f.role==="user"?"User":"Otagon"}: ${f.content}`).join(`
`),c=a.contextSummary?`**Historical Context (Previous Sessions):**
${a.contextSummary}

`:"",l=s||H.getDefaultProfile(),u=H.buildProfileContext(l);return`
**Persona: Game Companion**
You are Otagon, an immersive AI companion for the game "${a.gameTitle}".
The user's spoiler preference is: "${((p=t.preferences)==null?void 0:p.spoilerPreference)||"none"}".
The user's current session mode is: ${r?"ACTIVE (currently playing)":"PLANNING (not playing)"}.

**CRITICAL - RESPONSE BEHAVIOR:**
- NEVER start responses with self-introductions like "I am Otagon", "Hello! I'm Otagon", "As Otagon", or similar
- NEVER introduce yourself or state your name at the beginning of responses
- Jump directly into answering the user's question with helpful content
- Be conversational but focus on providing value immediately

${Oe}

${Ie}

${We}

**🎮 GAME-SPECIFIC ACCURACY FOR "${a.gameTitle}":**
- ONLY use terminology, locations, and characters that exist in "${a.gameTitle}"
- NEVER mix in content from similar games (e.g., if this is Elden Ring, don't mention "bonfires" or "Firelink Shrine")
- If the user asks about something you're unsure exists in this game, say: "I'm not certain that exists in ${a.gameTitle}. Could you clarify?"
- For specific stats/numbers (damage, health, percentages): Add "approximate" or "check in-game for exact values"

**Web Search Grounding Available:**
- You have access to Google Search for current information about this game
- Use web search for: patch notes, updates, DLC announcements, strategy guides, wiki information
- Your knowledge cutoff is January 2025 - use grounding for recent game updates or patches
- Always cite specific sources when using grounded information

**Game Context:**
- Game: ${a.gameTitle} (${a.genre})
- Current Objective: ${a.activeObjective||"Not set"}
- Game Progress: ${a.gameProgress||0}%

**Player Profile:**
${u}

**Current Subtabs (Your Knowledge Base):**
${o}

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

${er}

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
${Re}

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
`},sr=(a,e,t,r)=>{const s=r||H.getDefaultProfile(),n=H.buildProfileContext(s),o=a.messages.slice(-10).map(i=>`${i.role==="user"?"User":"Otagon"}: ${i.content}`).join(`
`);return`
**Persona: Pre-Release Game Companion**
You are Otagon, an AI companion helping users explore and discuss **${a.gameTitle}** - an UNRELEASED/UPCOMING game.

${Oe}

${Ie}

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
${n}

**Recent Conversation History:**
${o}

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
${Re}
`},ar=(a,e,t,r)=>{const s=r||H.getDefaultProfile(),n=H.buildProfileContext(s);return`
**Persona: Game Lore Expert & Screenshot Analyst**
You are Otagon, an expert at analyzing game visuals and providing immersive, lore-rich assistance.

${Oe}

${Ie}

${We}

**Player Profile:**
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
${Re}
`},Es=(a,e,t,r,s,n,o,i,c)=>{const l=o?Zt(o):"",u=i?`
**User Timezone:** ${i}
When discussing game release dates, provide times in the user's local timezone. For upcoming releases, be specific about exact date and time if known.
`:"",m=c?Jt(c):"",p=Xt(a,c);let f;s?f=ar(a,e,t,n):!a.isGameHub&&a.gameTitle?a.isUnreleased?f=sr(a,e,t,n):f=rr(a,e,t,r,n):f=tr(e);const C=[l,u,m,p].filter(Boolean).join(`
`);return C?C+`

`+f:f};class nr{constructor(){S(this,"retryAttempts",new Map);S(this,"MAX_RETRIES",3);S(this,"RETRY_DELAYS",[1e3,2e3,4e3])}async handleAIError(e,t){if(console.error(`🤖 [ErrorRecovery] AI Error in ${t.operation}:`,e),this.shouldRetry(t)){const r=this.getRetryDelay(t.retryCount);return await this.delay(r),{type:"retry",action:async()=>{}}}return e.message.includes("API key")||e.message.includes("authentication")?{type:"user_notification",message:"AI service authentication failed. Please check your API key in settings."}:e.message.includes("rate limit")||e.message.includes("quota")?{type:"user_notification",message:"AI service is temporarily busy. Please try again in a few moments."}:e.message.includes("network")||e.message.includes("timeout")?{type:"user_notification",message:"Network connection issue. Please check your internet connection and try again."}:{type:"user_notification",message:"AI service is temporarily unavailable. Please try again later."}}async handleConversationError(e,t){return console.error(`💬 [ErrorRecovery] Conversation Error in ${t.operation}:`,e),e.message.includes("not found")?{type:"fallback",message:"Conversation not found. Creating a new one.",action:async()=>{}}:e.message.includes("permission")||e.message.includes("unauthorized")?{type:"user_notification",message:"Permission denied. Please log in again."}:{type:"user_notification",message:"Failed to save conversation. Your data may not be persisted."}}async handleCacheError(e,t){return console.error(`💾 [ErrorRecovery] Cache Error in ${t.operation}:`,e),{type:"skip",message:"Cache unavailable. Continuing without caching."}}async handleWebSocketError(e,t){if(console.error(`🔌 [ErrorRecovery] WebSocket Error in ${t.operation}:`,e),this.shouldRetry(t)){const r=this.getRetryDelay(t.retryCount);return{type:"retry",action:async()=>{await this.delay(r)}}}return{type:"user_notification",message:"PC connection lost. Screenshot upload may not be available."}}shouldRetry(e){const t=`${e.operation}_${e.conversationId||"global"}`;return(this.retryAttempts.get(t)||0)<this.MAX_RETRIES}getRetryDelay(e){return this.RETRY_DELAYS[Math.min(e,this.RETRY_DELAYS.length-1)]}incrementRetryCount(e){const t=`${e.operation}_${e.conversationId||"global"}`,r=this.retryAttempts.get(t)||0;this.retryAttempts.set(t,r+1)}resetRetryCount(e){const t=`${e.operation}_${e.conversationId||"global"}`;this.retryAttempts.delete(t)}delay(e){return new Promise(t=>setTimeout(t,e))}displayError(e,t="error"){console.log(`[${t.toUpperCase()}] ${e}`),t==="error"&&console.error("User Error:",e)}logError(e,t,r){console.error("Error Details:",{error:e.message,stack:e.stack,context:t,additionalInfo:r,timestamp:new Date().toISOString()})}}const ws=new nr;class or{constructor(){S(this,"gameTones",{"Action RPG":{adjectives:["epic","heroic","legendary","mystical","ancient"],personality:"wise and experienced adventurer",speechPattern:"speaks with the wisdom of ages and the thrill of adventure",loreStyle:"rich with mythology and ancient secrets"},FPS:{adjectives:["intense","tactical","precise","combat-ready","strategic"],personality:"battle-hardened soldier",speechPattern:"communicates with military precision and combat experience",loreStyle:"focused on warfare, technology, and military history"},Horror:{adjectives:["ominous","chilling","mysterious","haunting","eerie"],personality:"knowledgeable survivor",speechPattern:"speaks with caution and awareness of lurking dangers",loreStyle:"dark and atmospheric, filled with supernatural elements"},Puzzle:{adjectives:["logical","methodical","analytical","clever","systematic"],personality:"brilliant problem-solver",speechPattern:"explains with clear logic and step-by-step reasoning",loreStyle:"intellectual and mysterious, focused on patterns and solutions"},RPG:{adjectives:["immersive","narrative-driven","character-focused","epic","emotional"],personality:"storyteller and guide",speechPattern:"speaks like a narrator, weaving tales and character development",loreStyle:"deep character development and rich storytelling"},Strategy:{adjectives:["tactical","strategic","calculated","methodical","commanding"],personality:"master tactician",speechPattern:"speaks with authority and strategic insight",loreStyle:"focused on warfare, politics, and grand strategy"},Adventure:{adjectives:["exploratory","curious","adventurous","discoverer","wanderer"],personality:"intrepid explorer",speechPattern:"speaks with wonder and excitement about discovery",loreStyle:"filled with exploration, discovery, and world-building"},Default:{adjectives:["helpful","knowledgeable","friendly","supportive","engaging"],personality:"helpful gaming companion",speechPattern:"speaks clearly and helpfully",loreStyle:"focused on gameplay and helpful information"}})}getGameTone(e){return this.gameTones[e]||this.gameTones.Default}generateImmersionContext(e){const t=this.getGameTone(e.genre);let r=`**Immersion Context for ${e.gameTitle}:**
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

${e}`),r}getGenreSuggestions(e,t){const r=["Tell me more about this area","What should I do next?","Any tips for this situation?"];return{"Action RPG":["What's the lore behind this location?","How do I improve my character?","What quests are available here?","Tell me about the local NPCs"],FPS:["What's the best tactical approach?","What weapons work best here?","How do I flank the enemy?","What's the mission objective?"],Horror:["What's the history of this place?","How do I survive this area?","What should I be careful of?","Tell me about the local legends"],Puzzle:["What's the pattern here?","How do I solve this step by step?","What clues am I missing?","What's the logical approach?"],RPG:["Tell me about the story so far","What choices should I make?","How do I develop my character?","What's the significance of this moment?"],Strategy:["What's the best strategy here?","How do I manage my resources?","What's the optimal build order?","How do I counter this threat?"]}[e]||r}createImmersiveSubTabContent(e,t,r){var n,o;const s={walkthrough:{"Action RPG":`# ${t} - Walkthrough

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
*Master the game...*`}};return((n=s[e])==null?void 0:n[r])||((o=s[e])==null?void 0:o.Default)||`# ${t} - ${e}

*Content loading...*`}}const Ts=new or,ir=`You are a correction validator for OTAKON, an AI gaming companion.
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
}`,cr=(a,e,t)=>`
Validate this correction:

ORIGINAL AI RESPONSE (snippet):
"${a.slice(0,500)}"

USER'S CORRECTION:
"${e}"

GAME CONTEXT: ${t||"General gaming / Game Hub"}

Is this correction valid? Respond with JSON only.`,Le="otakon_correction_submissions",ie=3;function ut(){try{const a=localStorage.getItem(Le),e=Date.now();if(!a)return{allowed:!0,remaining:ie};const t=JSON.parse(a);if(e>t.resetAt)return{allowed:!0,remaining:ie};const r=ie-t.count;return{allowed:r>0,remaining:Math.max(0,r)}}catch{return{allowed:!0,remaining:ie}}}function lr(){try{const a=localStorage.getItem(Le),e=Date.now(),t=1440*60*1e3;let r={count:0,resetAt:e+t};a&&(r=JSON.parse(a),e>r.resetAt&&(r={count:0,resetAt:e+t})),r.count++,localStorage.setItem(Le,JSON.stringify(r))}catch{}}async function dt(a,e,t){if(!e.trim())return{isValid:!1,reason:"Correction text is empty"};if(e.length<5)return{isValid:!1,reason:"Correction is too short"};if(e.length>1e3)return{isValid:!1,reason:"Correction is too long (max 1000 characters)"};const r=[/\b(hate|kill|die|attack)\s+(all|every|those)\b/i,/\b(racial|ethnic)\s+slur/i,/\bviolence\s+against\b/i];for(const s of r)if(s.test(e))return{isValid:!1,reason:"Correction contains inappropriate content"};try{const{data:s,error:n}=await d.functions.invoke("gemini-chat",{body:{messages:[{role:"system",content:ir},{role:"user",content:cr(a,e,t)}],model:"gemini-2.0-flash",temperature:.1,maxTokens:200}});if(n)return console.error("[CorrectionService] Validation API error:",n),{isValid:!1,reason:"Validation service temporarily unavailable. Please try again later."};const o=(s==null?void 0:s.content)||(s==null?void 0:s.response)||"",i=o.match(/\{[\s\S]*\}/);if(i){const c=JSON.parse(i[0]);return{isValid:c.isValid===!0,reason:c.reason||"Validation complete",suggestedType:c.suggestedType||void 0}}return console.warn("[CorrectionService] Could not parse validation response:",o),{isValid:!1,reason:"Validation response was unclear. Please try again."}}catch(s){return console.error("[CorrectionService] Validation exception:",s),{isValid:!1,reason:"Validation failed. Please try again later."}}}async function ur(a,e){if(!ut().allowed)return{success:!1,error:`Daily correction limit reached (${ie}/day). Try again tomorrow.`};const r=await dt(e.originalResponse,e.correctionText,e.gameTitle),{error:s}=await d.from("ai_feedback").insert({user_id:a,conversation_id:e.conversationId,message_id:e.messageId,feedback_type:"down",content_type:"message",category:"correction",comment:e.originalResponse.slice(0,500),correction_text:e.correctionText,correction_type:e.type,correction_scope:e.scope,is_validated:r.isValid,validation_reason:r.reason,game_title:e.gameTitle});if(s)return console.error("[CorrectionService] Failed to store feedback:",s),{success:!1,error:"Failed to save correction"};if(!r.isValid)return{success:!1,error:r.reason};const n=await L.addCorrection(a,{gameTitle:e.gameTitle,originalSnippet:e.originalResponse.slice(0,200),correctionText:e.correctionText,type:r.suggestedType||e.type,scope:e.scope});return n.success?(lr(),{success:!0,correction:(await L.getActiveCorrections(a,e.gameTitle)).find(c=>c.correctionText===e.correctionText)}):{success:!1,error:n.error}}const dr=[/\b(boss(?:es)?|mini-boss|final boss)\b/gi,/\b(enemy types?|elite enemies|common enemies)\b/gi,/\b(legendary weapon|rare item|unique gear)\b/gi,/\b(skill tree|ability points?|talent build)\b/gi,/\b(main quest|side quest|daily quest)\b/gi,/\b(damage build|tank build|support build|dps build)\b/gi,/\b(speedrun(?:ning)?|world record|personal best)\b/gi,/\b(secret area|hidden path|easter egg)\b/gi,/\b(tier list|meta build|optimal strategy)\b/gi,/\b(patch notes?|balance changes?|nerf(?:ed)?|buff(?:ed)?)\b/gi,/\b(dlc|expansion pack|season pass)\b/gi,/\b(game mechanics?|combat system|progression system)\b/gi,/\b(character build|loadout guide|equipment guide)\b/gi],gr=/\b([A-Z][a-z]{2,}(?:\s+(?:of|the|and)\s+)?[A-Z][a-z]{2,}(?:\s+[A-Z][a-z]+)?)\b/g;function mr(a){if(!a||a.length<100)return[];const e=new Set;for(const o of dr){const i=a.match(o);if(i)for(const c of i){const l=c.toLowerCase().trim();l.length>=6&&l.length<=50&&l.includes(" ")&&e.add(l)}}let t=0;const r=a.match(gr);if(r)for(const o of r){if(t>=5)break;const i=o.toLowerCase().trim();i.length>=6&&i.length<=40&&(e.add(i),t++)}const s=/\b(chapter|level|stage|floor|wave|round|phase|part|episode|act)\s+(\d+)\b/gi;let n;for(;(n=s.exec(a))!==null;)e.add(`${n[1].toLowerCase()} ${n[2]}`);return Array.from(e).slice(0,10)}async function hr(a){return(await L.getBehaviorData(a)).aiCorrections}async function pr(a,e){return L.getActiveCorrections(a,e,!0)}function fr(){return ut()}const z={validateCorrection:dt,submitCorrection:ur,getAllCorrections:hr,getContextualCorrections:pr,getRateLimitStatus:fr,extractTopicsFromResponse:mr,toggleCorrection:L.toggleCorrection,removeCorrection:L.removeCorrection};class Sr{constructor(){S(this,"STORAGE_KEY","otakon_used_suggested_prompts");S(this,"LAST_RESET_KEY","otakon_suggested_prompts_last_reset");S(this,"RESET_INTERVAL_MS",1440*60*1e3);S(this,"usedPrompts",new Set);this.loadUsedPrompts(),this.checkAndResetIfNeeded()}loadUsedPrompts(){try{const e=localStorage.getItem(this.STORAGE_KEY);if(e){const t=JSON.parse(e);this.usedPrompts=new Set(t)}}catch{this.usedPrompts=new Set}}saveUsedPrompts(){try{const e=Array.from(this.usedPrompts);localStorage.setItem(this.STORAGE_KEY,JSON.stringify(e))}catch{}}checkAndResetIfNeeded(){try{const e=localStorage.getItem(this.LAST_RESET_KEY),t=Date.now();(!e||t-parseInt(e)>=this.RESET_INTERVAL_MS)&&(this.resetUsedPrompts(),localStorage.setItem(this.LAST_RESET_KEY,t.toString()))}catch{}}markPromptAsUsed(e){this.usedPrompts.add(e),this.saveUsedPrompts()}isPromptUsed(e){return this.usedPrompts.has(e)}getUnusedPrompts(e){return e.filter(t=>!this.isPromptUsed(t))}areAllPromptsUsed(e){return e.every(t=>this.isPromptUsed(t))}resetUsedPrompts(){this.usedPrompts.clear(),localStorage.removeItem(this.STORAGE_KEY)}getUsedCount(){return this.usedPrompts.size}getTimeUntilNextReset(){try{const e=localStorage.getItem(this.LAST_RESET_KEY);if(!e)return 0;const t=parseInt(e)+this.RESET_INTERVAL_MS;return Math.max(0,t-Date.now())}catch{return 0}}getStaticNewsPrompts(){return Et}processAISuggestions(e){if(!e)return[];let t=[];if(Array.isArray(e))t=e;else if(typeof e=="string"){let s=e.trim();s.startsWith('["')&&!s.endsWith('"]')&&(s.endsWith('"')||(s+='"'),s.endsWith("]")||(s+="]"));try{const n=JSON.parse(s);Array.isArray(n)?t=n:t=[e]}catch{s.includes('", "')||s.includes(`",
"`)?t=s.split(/",\s*"/).map(o=>o.replace(/^["\s]+|["\s]+$/g,"")).filter(o=>o.length>0):s.includes(`
`)?t=s.split(`
`).map(o=>o.replace(/^["\s]+|["\s]+$/g,"")).filter(o=>o.length>0):t=[e]}}return t.filter(s=>s&&typeof s=="string"&&s.trim().length>0).map(s=>s.trim()).slice(0,3)}getFallbackSuggestions(e,t){return t===!0||e==="game-hub"||e==="everything-else"?this.getStaticNewsPrompts():["What should I do next in this area?","Tell me about the story so far","Give me some tips for this game","What are the key mechanics I should know?"]}}const _s=new Sr,de=new Map,yr=300*1e3;function br(a,e,t){return`${a}:${e}:${t||"global"}`}function Er(a){const e=de.get(a);return e?Date.now()-e.timestamp>yr?(de.delete(a),null):e.prompts:null}function wr(a,e){de.set(a,{prompts:e,timestamp:Date.now()})}function gt(a){for(const e of de.keys())e.startsWith(a)&&de.delete(e)}async function He(a,e,t=null,r=20){const s=br(a,e,t),n=Er(s);if(n)return n;try{const o=new Date;o.setDate(o.getDate()-7);let i=d.from("ai_shown_prompts").select("prompt_text").eq("auth_user_id",a).eq("prompt_type",e).gte("shown_at",o.toISOString()).order("shown_at",{ascending:!1}).limit(r);t&&(i=i.or(`game_title.eq.${t},game_title.is.null`));const{data:c,error:l}=await i;if(l)return console.error("[ShownPromptsService] Error fetching prompts:",l),[];const u=(c||[]).map(m=>m.prompt_text);return wr(s,u),u}catch(o){return console.error("[ShownPromptsService] Exception fetching prompts:",o),[]}}async function Tr(a,e){try{const{error:t}=await d.from("ai_shown_prompts").insert({auth_user_id:a,prompt_text:e.promptText,prompt_type:e.promptType,game_title:e.gameTitle||null,conversation_id:e.conversationId||null});return t?(console.error("[ShownPromptsService] Error recording prompt:",t),!1):(gt(a),!0)}catch(t){return console.error("[ShownPromptsService] Exception recording prompt:",t),!1}}async function _r(a,e){if(!e.length)return!0;try{const t=e.map(s=>({auth_user_id:a,prompt_text:s.promptText,prompt_type:s.promptType,game_title:s.gameTitle||null,conversation_id:s.conversationId||null})),{error:r}=await d.from("ai_shown_prompts").insert(t);return r?(console.error("[ShownPromptsService] Error batch recording prompts:",r),!1):(gt(a),!0)}catch(t){return console.error("[ShownPromptsService] Exception batch recording prompts:",t),!1}}async function vr(a,e){try{const{error:t}=await d.from("ai_shown_prompts").update({clicked:!0,clicked_at:new Date().toISOString()}).eq("auth_user_id",a).eq("prompt_text",e).is("clicked",!1);return t?(console.error("[ShownPromptsService] Error marking prompt clicked:",t),!1):!0}catch(t){return console.error("[ShownPromptsService] Exception marking prompt clicked:",t),!1}}async function Ar(a,e,t,r=null){if(!e.length)return[];const s=await He(a,t,r),n=new Set(s.map(o=>o.toLowerCase().trim()));return e.filter(o=>!n.has(o.toLowerCase().trim()))}async function Cr(a,e,t,r=null){const s=await He(a,t,r),n=e.toLowerCase().trim();return s.some(o=>o.toLowerCase().trim()===n)}const vs={getRecentShownPrompts:He,recordShownPrompt:Tr,recordShownPrompts:_r,markPromptClicked:vr,filterNewPrompts:Ar,hasPromptBeenShown:Cr};class Or{async generatePlayingSessionSummary(e){const t=e.messages.slice(-10),r=this.extractKeyPointsIntelligent(t,"playing"),s=this.extractObjectivesIntelligent(t,e),n=this.generateProgressContext(e),o=`**Playing Session Summary for ${e.gameTitle}**

${n}

**Key Achievements This Session:**
${r.length>0?r.map(i=>`• ${i}`).join(`
`):"• Session progress recorded"}

**Current Objectives:**
${s.length>0?s.map(i=>`• ${i}`).join(`
`):"• Continue game progression"}

**Recent Activity:**
${this.extractRecentActivity(t,3)}

*Switching to Planning Mode - Your progress has been saved.*`;return{mode:"playing",gameTitle:e.gameTitle||"Unknown Game",conversationId:e.id,summary:o,keyPoints:r,objectives:s,timestamp:Date.now(),aiGenerated:!0}}async generatePlanningSessionSummary(e){const t=e.messages.slice(-10),r=this.extractKeyPointsIntelligent(t,"planning"),s=this.extractObjectivesIntelligent(t,e),n=this.extractStrategicNotes(t),o=`**Planning Session Summary for ${e.gameTitle}**

**Strategies Discussed:**
${r.length>0?r.map(i=>`• ${i}`).join(`
`):"• No specific strategies noted"}

**Goals for Next Session:**
${s.length>0?s.map(i=>`• ${i}`).join(`
`):"• Continue exploration and progression"}

${n?`**Strategic Notes:**
${n}
`:""}
*Switching to Playing Mode - Good luck with your session!*`;return{mode:"planning",gameTitle:e.gameTitle||"Unknown Game",conversationId:e.id,summary:o,keyPoints:r,objectives:s,timestamp:Date.now(),aiGenerated:!0}}generateProgressContext(e){const t=[];return e.gameProgress&&e.gameProgress>0&&t.push(`**Progress:** ${e.gameProgress}%`),e.activeObjective&&t.push(`**Current Focus:** ${e.activeObjective}`),t.length>0?t.join(`
`):"**Progress:** Session in progress"}extractKeyPointsIntelligent(e,t){const r=[],s=new Set,i=t==="playing"?[{pattern:/defeated|killed|beat|vanquished/i,template:c=>this.extractContext(c,"boss/enemy")},{pattern:/found|discovered|obtained|acquired|picked up/i,template:c=>this.extractContext(c,"item/discovery")},{pattern:/unlocked|gained|learned|mastered/i,template:c=>this.extractContext(c,"ability/unlock")},{pattern:/completed|finished|cleared/i,template:c=>this.extractContext(c,"completion")},{pattern:/reached|arrived|entered/i,template:c=>this.extractContext(c,"location")}]:[{pattern:/build|spec|loadout|equipment/i,template:c=>this.extractContext(c,"build")},{pattern:/strategy|approach|tactic/i,template:c=>this.extractContext(c,"strategy")},{pattern:/should|recommend|best|optimal/i,template:c=>this.extractContext(c,"recommendation")},{pattern:/prepare|before|need to/i,template:c=>this.extractContext(c,"preparation")}];for(const c of e)if(c.role==="assistant"){for(const{pattern:l,template:u}of i)if(l.test(c.content)){const m=u(c.content),p=m.toLowerCase().substring(0,30);if(m&&!s.has(p)&&(s.add(p),r.push(m),r.length>=5))break}if(r.length>=5)break}return r}extractContext(e,t){const r=e.split(/[.!?]+/).filter(s=>s.trim().length>10);for(const s of r){const n=s.trim();if(!(n.length>150)&&(t==="boss/enemy"&&/defeat|kill|beat|boss|enemy/i.test(n)||t==="item/discovery"&&/found|discover|obtain|item|weapon|armor/i.test(n)||t==="ability/unlock"&&/unlock|gain|learn|ability|skill/i.test(n)||t==="completion"&&/complete|finish|clear/i.test(n)||t==="location"&&/reach|arrive|enter|area|region|zone/i.test(n)||t==="build"&&/build|spec|loadout|equipment/i.test(n)||t==="strategy"&&/strategy|approach|tactic/i.test(n)||t==="recommendation"&&/should|recommend|best|optimal/i.test(n)||t==="preparation"&&/prepare|before|need/i.test(n)))return n.substring(0,100)+(n.length>100?"...":"")}return""}extractObjectivesIntelligent(e,t){const r=[];t.activeObjective&&r.push(t.activeObjective);for(const s of e){if(s.role!=="assistant")continue;const n=[/next.*(?:step|objective|goal).*[:is]\s*([^.!?\n]+)/i,/you (?:should|need to|must)\s+([^.!?\n]+)/i,/(?:focus on|head to|go to)\s+([^.!?\n]+)/i];for(const o of n){const i=s.content.match(o);if(i&&i[1]){const c=i[1].trim().substring(0,80);if(c&&!r.includes(c)&&(r.push(c),r.length>=3))break}}if(r.length>=3)break}return r}extractStrategicNotes(e){const t=[];for(const r of e){if(r.role!=="assistant")continue;const s=r.content.match(/[•\-*]\s+[^\n]+/g);if(s)for(const n of s.slice(0,3))t.push(n.trim());if(t.length>=3)break}return t.join(`
`)}extractRecentActivity(e,t){const r=e.filter(s=>s.role==="assistant").slice(-t);return r.length===0?"• No recent activity recorded":r.map(s=>{var i;const o=(((i=s.content.split(/[.!?]+/)[0])==null?void 0:i.trim())||"").replace(/\*\*/g,"").replace(/Hint:\s*/i,"").substring(0,80);return o?`• ${o}...`:null}).filter(Boolean).join(`
`)}async storeSessionSummary(e,t){}async getLatestSessionSummary(e){return null}}const As=new Or,Q=class Q{static getInstance(){return Q.instance||(Q.instance=new Q),Q.instance}async getSubtabs(e){return this.getSubtabsFromTable(e)}async setSubtabs(e,t){console.error(`🔄 [SubtabsService] Writing ${t.length} subtabs to normalized table for conversation:`,e);const r=await this.setSubtabsInTable(e,t);return console.error("  ✅ Table write:",r?"SUCCESS":"FAILED"),r}async addSubtab(e,t){const{data:r,error:s}=await d.from("conversations").select("is_unreleased, title").eq("id",e).single();if(s)return console.error("Error checking conversation for unreleased status:",s),null;if(r!=null&&r.is_unreleased)throw new Error("Subtabs cannot be created for unreleased games. This feature will be available once the game is released.");return await this.addSubtabToTable(e,t)}async updateSubtab(e,t,r){return await this.updateSubtabInTable(t,r)}async deleteSubtab(e,t){return this.deleteSubtabFromTable(t)}async getSubtabsFromTable(e){try{const{data:t,error:r}=await d.from("subtabs").select("*").eq("conversation_id",e).order("order_index",{ascending:!0});return r?(console.error("Error getting subtabs from table:",r),[]):(t||[]).map(s=>{const n=typeof s.metadata=="object"&&s.metadata!==null?s.metadata:{};return{id:s.id,conversationId:s.conversation_id??void 0,title:s.title,content:s.content||"",type:s.tab_type,isNew:n.isNew||!1,status:n.status||"loaded",instruction:n.instruction}})}catch(t){return console.error("Error getting subtabs from table:",t),[]}}async setSubtabsInTable(e,t){try{const{data:r,error:s}=await d.from("conversations").select("*").eq("id",e).single(),n=r==null?void 0:r.auth_user_id;if(s||!n)return console.error("❌ [SubtabsService] Error getting conversation auth_user_id:",s),console.error("❌ [SubtabsService] Conversation may not exist yet. ConversationId:",e),!1;console.error(`🔄 [SubtabsService] Using auth_user_id: ${n} for ${t.length} subtabs`);const{error:o}=await d.from("subtabs").delete().eq("conversation_id",e);if(o)return console.error("Error deleting existing subtabs:",o),!1;if(t.length>0){const i=t.map((l,u)=>(l.type||console.error(`⚠️ [SubtabsService] Subtab "${l.title}" has NULL type! Using fallback.`),{id:l.id,conversation_id:e,game_id:null,title:l.title||"Untitled",content:l.content||"",tab_type:l.type||"chat",order_index:u,auth_user_id:n,metadata:{isNew:l.isNew,status:l.status,instruction:l.instruction}}));console.error("🔄 [SubtabsService] Inserting subtabs:",i.map(l=>({title:l.title,tab_type:l.tab_type,has_auth_user_id:!!l.auth_user_id})));const{error:c}=await d.from("subtabs").insert(i);if(c)return console.error("❌ [SubtabsService] Error inserting subtabs:",c),console.error("❌ [SubtabsService] Failed subtabs data:",JSON.stringify(i,null,2)),!1;console.error("✅ [SubtabsService] Successfully inserted",t.length,"subtabs")}return!0}catch(r){return console.error("❌ [SubtabsService] Error setting subtabs in table:",r),!1}}async addSubtabToTable(e,t){var r;try{const{data:s}=await d.from("conversations").select("game_id").eq("id",e).single(),n=(s==null?void 0:s.game_id)||"",{data:o}=await d.from("subtabs").select("order_index").eq("conversation_id",e).order("order_index",{ascending:!1}).limit(1),i=((r=o==null?void 0:o[0])==null?void 0:r.order_index)??-1,{data:c,error:l}=await d.from("subtabs").insert({id:t.id,conversation_id:e,game_id:n,title:t.title,content:t.content,tab_type:t.type,order_index:i+1,metadata:{isNew:t.isNew,status:t.status,instruction:t.instruction}}).select().single();return l?(console.error("Error adding subtab to table:",l),null):{id:c.id,conversationId:c.conversation_id??void 0,title:c.title,content:ke(c.content),type:c.tab_type,isNew:typeof c.metadata=="object"&&c.metadata!==null&&!Array.isArray(c.metadata)&&c.metadata.isNew||!1,status:(typeof c.metadata=="object"&&c.metadata!==null&&!Array.isArray(c.metadata)?c.metadata.status:void 0)||"loaded",instruction:typeof c.metadata=="object"&&c.metadata!==null&&!Array.isArray(c.metadata)?c.metadata.instruction:void 0}}catch(s){return console.error("Error adding subtab to table:",s),null}}async updateSubtabInTable(e,t){try{const r={};if(t.title!==void 0&&(r.title=t.title),t.content!==void 0&&(r.content=t.content),t.type!==void 0&&(r.tab_type=t.type),t.isNew!==void 0||t.status!==void 0||t.instruction!==void 0){const{data:n}=await d.from("subtabs").select("metadata").eq("id",e).single(),o=typeof(n==null?void 0:n.metadata)=="object"&&(n==null?void 0:n.metadata)!==null?n.metadata:{};r.metadata={...o,...t.isNew!==void 0&&{isNew:t.isNew},...t.status!==void 0&&{status:t.status},...t.instruction!==void 0&&{instruction:t.instruction}}}const{error:s}=await d.from("subtabs").update(r).eq("id",e);return s?(console.error("Error updating subtab in table:",s),!1):!0}catch(r){return console.error("Error updating subtab in table:",r),!1}}async deleteSubtabFromTable(e){try{const{error:t}=await d.from("subtabs").delete().eq("id",e);return t?(console.error("Error deleting subtab from table:",t),!1):!0}catch(t){return console.error("Error deleting subtab from table:",t),!1}}async getSubtabsFromJsonb(e){try{const{data:t,error:r}=await d.from("conversations").select("subtabs").eq("id",e).single();return r?(console.error("Error getting subtabs from JSONB:",r),[]):(t==null?void 0:t.subtabs)||[]}catch(t){return console.error("Error getting subtabs from JSONB:",t),[]}}async setSubtabsInJsonb(e,t){try{const{error:r}=await d.from("conversations").update({subtabs:t,subtabs_order:t.map(s=>s.id)}).eq("id",e);return r?(console.error("Error setting subtabs in JSONB:",r),!1):!0}catch(r){return console.error("Error setting subtabs in JSONB:",r),!1}}async migrateConversationSubtabs(e){try{const t=await this.getSubtabsFromJsonb(e);return t.length===0?!0:await this.setSubtabsInTable(e,t)}catch(t){return console.error("Error migrating subtabs:",t),!1}}async rollbackConversationSubtabs(e){try{const t=await this.getSubtabsFromTable(e);return t.length===0?!0:await this.setSubtabsInJsonb(e,t)}catch(t){return console.error("Error rolling back subtabs:",t),!1}}async migrateAllSubtabs(){try{const{data:e,error:t}=await d.from("conversations").select("id, subtabs").not("subtabs","is",null);if(t)return console.error("Error fetching conversations:",t),{success:0,failed:0};let r=0,s=0;const n=(e||[]).filter(i=>i.subtabs&&Array.isArray(i.subtabs)&&i.subtabs.length>0).map(i=>this.migrateConversationSubtabs(i.id));return(await Promise.allSettled(n)).forEach(i=>{i.status==="fulfilled"&&i.value?r++:s++}),{success:r,failed:s}}catch(e){return console.error("Error in batch migration:",e),{success:0,failed:0}}}};S(Q,"instance");let $e=Q;const Y=$e.getInstance(),Qe=3e3;function Te(){var a;return((a=globalThis.crypto)==null?void 0:a.randomUUID())||"xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g,e=>{const t=Math.random()*16|0;return(e==="x"?t:t&3|8).toString(16)})}class Ir{async createGameTab(e){var i,c,l;const t=await A.getConversation(e.conversationId);if(t){if(e.aiResponse&&((i=t.subtabs)!=null&&i.some(u=>u.status==="loading"||u.content==="Loading..."))){const u=this.extractInsightsFromAIResponse(e.aiResponse,t.subtabs);return await A.updateConversation(t.id,{subtabs:u,updatedAt:Date.now()}),{...t,subtabs:u}}return t}const r=e.userTier||"free",s=r==="pro"||r==="vanguard_pro";console.log("🎮 [GameTabService] Creating new game tab:",{gameTitle:e.gameTitle,userTier:r,isPro:s,isUnreleased:e.isUnreleased,hasAiResponse:!!e.aiResponse});let n=[];if(!e.isUnreleased&&s)if(e.aiResponse)if(console.error("🎮 [GameTabService] Extracting subtabs from AI response"),(c=e.aiResponse.gamePillData)!=null&&c.wikiContent&&Object.keys(e.aiResponse.gamePillData.wikiContent).length>0)console.error("🎮 [GameTabService] Found gamePillData.wikiContent with",Object.keys(e.aiResponse.gamePillData.wikiContent).length,"tabs"),n=Object.entries(e.aiResponse.gamePillData.wikiContent).map(([u,m])=>({id:Te(),title:this.formatTabTitle(u),type:this.determineTabType(u),content:m,isNew:!1,status:"loaded"})),console.error("🎮 [GameTabService] Created",n.length,"subtabs from gamePillData.wikiContent");else if(e.aiResponse.progressiveInsightUpdates&&e.aiResponse.progressiveInsightUpdates.length>0)console.error("🎮 [GameTabService] Found progressiveInsightUpdates with",e.aiResponse.progressiveInsightUpdates.length,"updates"),n=e.aiResponse.progressiveInsightUpdates.map(u=>({id:Te(),title:u.title,type:this.determineTabType(u.tabId),content:u.content,isNew:!1,status:"loaded"})),console.error("🎮 [GameTabService] Created",n.length,"subtabs from progressiveInsightUpdates");else{const u=this.extractInsightsFromAIResponse(e.aiResponse,[]);u.length>0?(n=u,console.error("🎮 [GameTabService] Created",n.length,"subtabs from INSIGHT_UPDATE tags")):(n=this.generateInitialSubTabs(e.genre||"Default",e.playerProfile),console.error("🎮 [GameTabService] Created",n.length,"template subtabs (will populate via background AI using conversation context)"))}else n=this.generateInitialSubTabs(e.genre||"Default",e.playerProfile),console.error("🎮 [GameTabService] Created",n.length,"initial template subtabs (no AI response)");else e.isUnreleased?console.error("🎮 [GameTabService] Creating unreleased game tab (no subtabs, Discuss mode only)"):console.error("🔒 [GameTabService] Subtabs disabled for free tier users");const o={id:e.conversationId,title:e.gameTitle,messages:[],createdAt:Date.now(),updatedAt:Date.now(),isActive:!1,gameId:e.gameTitle.toLowerCase().replace(/\s+/g,"-"),gameTitle:e.gameTitle,genre:e.genre,subtabs:n,subtabsOrder:n.map(u=>u.id),isActiveSession:!0,activeObjective:"",gameProgress:0,isUnreleased:e.isUnreleased||!1};return await A.addConversation(o),n.length>0&&s?(console.error("🎮 [GameTabService] Saving",n.length,"subtabs for conversation:",o.id),console.error("🎮 [GameTabService] Subtabs:",JSON.stringify(n.map(m=>({id:m.id,title:m.title,type:m.type,hasType:!!m.type})),null,2)),await new Promise(m=>setTimeout(m,200)),await Y.setSubtabs(o.id,n)||console.error("❌ [GameTabService] Failed to save subtabs - conversation may not exist yet")):s?console.error("🎮 [GameTabService] No subtabs to save for conversation:",o.id):console.error("🔒 [GameTabService] Skipping subtabs save for free tier user"),s?e.aiResponse?(l=o.subtabs)!=null&&l.some(m=>m.content==="Loading...")&&this.generateInitialInsights(o,e.playerProfile,e.aiResponse).catch(m=>console.error("Background insight generation failed:",m)):this.generateInitialInsights(o,e.playerProfile,e.aiResponse).catch(u=>console.error("Background insight generation failed:",u)):console.error("🔒 [GameTabService] Skipping AI insight generation for free tier user"),o}generateInitialSubTabs(e,t,r){let n=(ze[e]||ze.Default).map(o=>({...o,priority:"medium",isProfileSpecific:!1}));if(t){console.error("🎮 [GameTabService] Generating profile-specific tabs for:",t.playerFocus);const o=H.generateProfileSpecificTabs(t,r);n=[...n,...o],n=H.prioritizeTabsForProfile(n,t)}return n.map(o=>({id:Te(),title:o.title,type:o.type,content:"Loading...",isNew:!0,status:"loading",instruction:o.instruction}))}extractInsightsFromAIResponse(e,t){console.error("🤖 [GameTabService] Extracting dynamic insights from AI response");const r=e.otakonTags.get("INSIGHT_UPDATE");if(r){console.error("🤖 [GameTabService] Found INSIGHT_UPDATE:",r);const s=r;if(!s.id)return console.error("🤖 [GameTabService] INSIGHT_UPDATE missing id, skipping"),t;if(t.find(o=>o.id===s.id))return t.map(o=>o.id===s.id?{...o,content:s.content||o.content,isNew:!0,status:"loaded"}:o);{const o={id:Te(),title:this.formatTabTitle(s.id),type:this.determineTabType(s.id),content:s.content||"",isNew:!0,status:"loaded"};return[...t,o]}}return t}formatTabTitle(e){return e.split("_").map(t=>t.charAt(0).toUpperCase()+t.slice(1)).join(" ")}determineTabType(e){return e.includes("story")?"story":e.includes("character")?"characters":e.includes("strategy")||e.includes("tips")?"tips":e.includes("boss")?"strategies":e.includes("quest")||e.includes("walkthrough")?"walkthrough":e.includes("item")?"items":"chat"}async generateInitialInsights(e,t,r){var o,i,c;const s=e.id,n=e.gameTitle;console.error(`🤖 [GameTabService] 🔄 [${s}] Generating initial insights for: ${n}`);try{const l=await A.getConversations(!0);if(!l[s]){console.error(`🤖 [GameTabService] [${s}] ⚠️ Conversation no longer exists, aborting insight generation`);return}let u="";const m=l[s],p=((o=m.messages)==null?void 0:o.length)||0;if(p>10)try{const E=await Pt.loadConversationSummary(s),O=m.messages.slice(-5).map(M=>`${M.role==="user"?"User":"AI"}: ${M.content}`).join(`

`);E?(u=`Previous Context Summary:
${JSON.stringify(E)}

Recent Messages (guaranteed fresh):
${O}`,console.error(`🤖 [GameTabService] [${s}] ✅ Using summary + 5 recent messages (${p} total msgs)`)):(u=m.messages.slice(-10).map(M=>`${M.role==="user"?"User":"AI"}: ${M.content}`).join(`

`),console.error(`🤖 [GameTabService] [${s}] Using last 10 messages (no summary available)`))}catch{u=m.messages.slice(-10).map(O=>`${O.role==="user"?"User":"AI"}: ${O.content}`).join(`

`),console.error(`🤖 [GameTabService] [${s}] Using last 10 messages (summary load failed)`)}else p>0?(u=m.messages.map(E=>`${E.role==="user"?"User":"AI"}: ${E.content}`).join(`

`),console.error(`🤖 [GameTabService] [${s}] ✅ Using all ${p} messages`)):r!=null&&r.content?(u=`AI Analysis: ${r.content}`,console.error(`🤖 [GameTabService] [${s}] Using AI response as context (${r.content.length} chars)`)):console.error(`🤖 [GameTabService] [${s}] ⚠️ No context available`);console.error(`🤖 [GameTabService] [${s}] 🚀 Calling AI generateInitialInsights...`);const f=await at.generateInitialInsights(n||"Unknown Game",e.genre||"Action RPG",t,u);console.error(`🤖 [GameTabService] [${s}] 📥 AI returned:`,Object.keys(f).length,"insights");const C=f&&Object.keys(f).length>0;C?console.error(`🤖 [GameTabService] [${s}] ✅ Got ${Object.keys(f).length} insights:`,Object.keys(f)):console.error(`🤖 [GameTabService] [${s}] ❌ Empty insights, using fallback`);const h=l[s];if(!h){console.error(`🤖 [GameTabService] [${s}] ⚠️ Conversation not found, may have been deleted`);return}const g=await Y.getSubtabs(s);console.error(`🤖 [GameTabService] [${s}] 📖 Read ${g.length} subtabs from database`),h.subtabs=g;const _={"Story So Far":"story_so_far","Relevant Lore":"game_lore","Lore Exploration":"lore_exploration","Environmental Storytelling":"environmental_storytelling","Active Quests":"quest_log","Story Progression":"story_progression","Quest Guide":"quest_guide","Build Optimization":"build_optimization","Build Guide":"build_guide","Character Building":"character_building","Combat Strategies":"combat_strategies","Boss Strategy":"boss_strategy","Upcoming Boss Strategy":"boss_strategy","Consumable Strategy":"consumable_strategy","Hidden Paths & Secrets":"hidden_paths","Pro Tips":"pro_tips","Exploration Tips":"exploration_tips","Hidden Secrets":"hidden_secrets","Items You May Have Missed":"missed_items","Collectible Hunting":"collectible_hunting","Points of Interest":"points_of_interest","Region Guide":"points_of_interest","Plan Your Next Session":"next_session_plan","Activity Checklist":"next_session_plan","Dynamic World Events":"points_of_interest","Exploration Route":"exploration_route","Fast Travel Optimization":"pro_tips","Progression Balance":"next_session_plan","Death Recovery Strategy":"death_recovery","NPC Questlines":"npc_questlines","Level Layout Insights":"level_layout","Companion Management":"companion_management","Side Activity Guide":"side_activity_guide","NPC Interactions":"npc_interactions","New Ability Unlocked":"ability_unlocks","Backtracking Guide":"backtracking_guide","Map Completion":"map_completion","Sequence Breaking Options":"sequence_breaking","Upgrade Priority":"upgrade_priority","Resource Locations":"resource_locations","Base Building Guide":"base_building","Crafting Priority":"crafting_priority","Survival Tips":"survival_tips","Exploration Targets":"exploration_targets","Progression Roadmap":"progression_roadmap","Danger Warnings":"danger_warnings","Multiplayer Synergy":"multiplayer_synergy","Seasonal Preparation":"seasonal_preparation","Resource Management":"resource_management","Safe Zone Mapping":"safe_zone_mapping","Sanity Management":"sanity_management","Progressive Fear Adaptation":"fear_adaptation","Loadout Analysis":"loadout_analysis","Map Strategies":"map_strategies","Enemy Intel":"enemy_intel","Weapon Mastery":"weapon_mastery","Audio Cues Guide":"audio_cues","Progression Tracker":"progression_tracker","Current State Analysis":"current_board_state","Opening Builds":"opening_moves","Unit Counters":"unit_counters","Economy Management":"economy_guide","Tech Tree Priority":"tech_tree_priority","Map Control Points":"map_control_points","Opponent Analysis":"opponent_analysis","Puzzle Solving":"puzzle_solving","Inventory Optimization":"inventory_optimization"};console.error("🤖 [GameTabService] Building content mapping for subtabs...");const N=((i=h.subtabs)==null?void 0:i.map(E=>{let O="";const M=_[E.title];if(C&&M&&f[M]&&(O=f[M],console.error(`🤖 [GameTabService] Subtab "${E.title}" using AI content from key "${M}" (${O.length} chars)`)),!O){let he=u;if(E.type==="story"&&u.includes("Lore:")){const F=u.match(/Lore:(.*?)(?=\n\n|\n[A-Z]|$)/s);he=F?F[1].trim():u}else if(E.type==="strategies"&&u.includes("Analysis:")){const F=u.match(/Analysis:(.*?)(?=\n\n|\n[A-Z]|$)/s);he=F?F[1].trim():u}else if(E.type==="tips"&&u.includes("Hint:")){const F=u.match(/Hint:(.*?)(?=\n\n|\n[A-Z]|$)/s);he=F?F[1].trim():u}O=`## ${E.title}

${he}`,console.error(`🤖 [GameTabService] Subtab "${E.title}" using fallback content from AI response (${O.length} chars)`),console.error("🤖 [GameTabService] Preview:",O.substring(0,150)+"...")}return{...E,content:O,isNew:!1,status:"loaded",type:E.type}}))||[];console.error("🤖 [GameTabService] Updating subtabs with content...");const U=N.map(E=>{var O;return{id:E.id,title:E.title,type:E.type,status:E.status,contentLength:((O=E.content)==null?void 0:O.length)||0,isNew:E.isNew,hasType:!!E.type}});if(console.error("🤖 [GameTabService] Subtabs to save:",U),console.error("🤖 [GameTabService] ALL statuses:",N.map(E=>E.status)),console.error("🤖 [GameTabService] ALL types:",N.map(E=>E.type||"MISSING_TYPE")),console.error("🤖 [GameTabService] 🗑️ Clearing cache BEFORE subtabs write..."),A.clearCache(),!await Y.setSubtabs(e.id,N))throw new Error("Failed to update subtabs in database");console.error("🤖 [GameTabService] ✅ Subtabs dual-write complete (table + JSONB)"),A.clearCache(),console.error("🤖 [GameTabService] 🔍 Subtabs saved successfully, skipping verification read"),await A.updateConversation(e.id,{updatedAt:Date.now()}),console.error("🤖 [GameTabService] ✅ Conversation metadata updated")}catch(l){console.error("🤖 [GameTabService] ❌ Failed to generate initial insights:",l),ae.warning("Failed to load game insights. You can still chat about the game!");try{const m=(await A.getConversations(!0))[e.id];if(!m){console.error("🤖 [GameTabService] Conversation not found for error update:",e.id);return}const p=((c=m.subtabs)==null?void 0:c.map(f=>({...f,content:`Failed to load ${f.title} content. Please try again later.`,isNew:!1,status:"error"})))||[];await Y.setSubtabs(e.id,p),await A.updateConversation(e.id,{updatedAt:Date.now()})}catch(u){console.error("🤖 [GameTabService] Failed to update error state:",u)}}}async updateSubTabContent(e,t,r){console.error("📝 [GameTabService] Updating sub-tab content:",{conversationId:e,subTabId:t});try{const n=(await A.getConversations())[e];if(!n||!n.subtabs)throw new Error("Conversation or sub-tabs not found");const o=n.subtabs.map(i=>i.id===t?{...i,content:r,isNew:!1,status:"loaded"}:i);await Y.setSubtabs(e,o),await A.updateConversation(e,{updatedAt:Date.now()})}catch(s){throw console.error("Failed to update sub-tab content:",s),s}}async getGameTab(e){try{const r=(await A.getConversations())[e];return!r||!r.gameTitle?null:{id:r.id,title:r.title,gameId:r.gameId||r.gameTitle.toLowerCase().replace(/\s+/g,"-"),gameTitle:r.gameTitle,genre:r.genre||"Unknown",subtabs:r.subtabs||[],createdAt:r.createdAt,updatedAt:r.updatedAt,isActiveSession:r.isActiveSession||!1}}catch(t){return console.error("Failed to get game tab:",t),ae.error("Failed to load game tab."),null}}isGameTab(e){return!e.isGameHub&&!!e.gameTitle}generateGameConversationId(e){return`game-${e.toLowerCase().replace(/[^a-z0-9\s-]/g,"").replace(/\s+/g,"-")}`}async updateSubtabsAfterMigration(e,t){console.error(`🔄 [GameTabService] [${e}] Updating subtabs after migration...`);try{const s=(await A.getConversations(!0))[e];if(!s){console.error(`🔄 [GameTabService] [${e}] ⚠️ Conversation not found, aborting`);return}if(!s.subtabs||s.subtabs.length===0){console.error(`🔄 [GameTabService] [${e}] No subtabs to update`);return}t!=null&&t.progressiveInsightUpdates&&t.progressiveInsightUpdates.length>0?(console.error(`🔄 [GameTabService] [${e}] Applying ${t.progressiveInsightUpdates.length} progressive updates`),await this.updateSubTabsFromAIResponse(e,t.progressiveInsightUpdates)):console.error(`🔄 [GameTabService] [${e}] No progressive updates in AI response`),console.error(`🔄 [GameTabService] [${e}] ✅ Subtab update complete`)}catch(r){console.error(`🔄 [GameTabService] [${e}] ❌ Failed to update subtabs:`,r)}}async updateSubTabsFromAIResponse(e,t){console.error(`📝 [GameTabService] [${e}] Updating subtabs from AI response:`,t.length);try{const s=(await A.getConversations(!0))[e];if(!s||!s.subtabs){console.error(`📝 [GameTabService] [${e}] ⚠️ Conversation or subtabs not found, aborting update`);return}let n=0;const o=s.subtabs.map(c=>{const l=t.find(u=>u.tabId===c.id);if(l){n++,console.error(`📝 [GameTabService] [${e}] Updating subtab: ${c.id} - ${l.title}`);const m=`

---
**Updated: `+new Date().toLocaleString()+`**

`;let f=c.content&&c.content.trim().length>0&&c.content!=="Loading..."&&c.status==="loaded"?c.content+m+l.content:l.content;if(f.length>Qe){console.error(`📝 [GameTabService] [${e}] Subtab ${c.id} exceeds ${Qe} chars, needs summarization`);const C=f.split(`

---
`);if(C.length>2){const h=C[0],g=C.slice(-3).join(`

---
`);f=h+`

---
**[Earlier entries summarized]**

---
`+g,console.error(`📝 [GameTabService] [${e}] Subtab ${c.id} content trimmed to ${f.length} chars`)}}return{...c,title:l.title||c.title,content:f,isNew:!0,status:"loaded"}}return c});if(n===0){console.error(`📝 [GameTabService] [${e}] ⚠️ No subtabs matched for update`);return}if(console.error(`📝 [GameTabService] [${e}] Writing ${n} updated subtabs to normalized table...`),!await Y.setSubtabs(e,o))throw console.error(`📝 [GameTabService] [${e}] ❌ Failed to write subtabs to table`),new Error("Failed to update subtabs in database");A.clearCache(),await A.updateConversation(e,{updatedAt:Date.now()}),console.error(`📝 [GameTabService] [${e}] ✅ Updated ${n} subtabs successfully (table + cache cleared)`)}catch(r){throw console.error(`📝 [GameTabService] [${e}] ❌ Failed to update subtabs:`,r),r}}async generateSubtabsForExistingGameTabs(e,t,r){const s=Object.values(e).filter(n=>!n.isGameHub&&!n.isUnreleased&&n.gameTitle&&(!n.subtabs||n.subtabs.length===0));if(s.length===0){console.log("🔄 [GameTabService] No game tabs need subtabs generation");return}console.log(`🔄 [GameTabService] Found ${s.length} game tabs that need subtabs`);for(let n=0;n<s.length;n++){const o=s[n];try{console.log(`🔄 [GameTabService] Generating subtabs for "${o.gameTitle}" (${n+1}/${s.length})`);const i=this.generateInitialSubTabs(o.genre||"Default",t);await A.updateConversation(o.id,{subtabs:i,subtabsOrder:i.map(c=>c.id),updatedAt:Date.now()}),await Y.setSubtabs(o.id,i),await this.generateInitialInsights({...o,subtabs:i},t),console.log(`✅ [GameTabService] Successfully generated subtabs for "${o.gameTitle}"`),r==null||r(n,s.length,o.gameTitle||o.title),n<s.length-1&&await new Promise(c=>setTimeout(c,1e3))}catch(i){console.error(`❌ [GameTabService] Failed to generate subtabs for "${o.gameTitle}":`,i)}}r==null||r(s.length,s.length,"Complete"),console.log(`🔄 [GameTabService] Finished generating subtabs for ${s.length} game tabs`)}}const Cs=new Ir,j=a=>a;class Os{static getCurrentUser(){return q.get(K.USER,null)}static setCurrentUser(e){q.set(K.USER,e)}static createUser(e,t=wt.FREE){const r=Date.now(),s=Ye[t];return{id:`user_${r}`,authUserId:`user_${r}`,email:e,tier:t,hasProfileSetup:!1,hasSeenSplashScreens:!1,hasSeenHowToUse:!1,hasSeenFeaturesConnected:!1,hasSeenProFeatures:!1,pcConnected:!1,pcConnectionSkipped:!1,onboardingCompleted:!1,hasWelcomeMessage:!1,isNewUser:!0,hasUsedTrial:!1,lastActivity:r,preferences:{},textCount:0,imageCount:0,textLimit:s.text,imageLimit:s.image,totalRequests:0,lastReset:r,usage:{textCount:0,imageCount:0,textLimit:s.text,imageLimit:s.image,totalRequests:0,lastReset:r,tier:t},appState:{},profileData:{},onboardingData:{},behaviorData:{},feedbackData:{},usageData:{},createdAt:r,updatedAt:r}}static updateUser(e){const t=this.getCurrentUser();if(!t)return;const r={...t,...e,updatedAt:Date.now()};this.setCurrentUser(r)}static updateUsage(e){const t=this.getCurrentUser();t&&this.updateUser({usage:{...t.usage,...e}})}static resetUsage(){const e=this.getCurrentUser();if(!e)return;const t=Ye[e.tier];this.updateUsage({textCount:0,imageCount:0,totalRequests:0,lastReset:Date.now(),textLimit:t.text,imageLimit:t.image})}static canMakeRequest(e){const t=this.getCurrentUser();if(!t)return!1;const{usage:r}=t;return e==="text"?r.textCount<r.textLimit:r.imageCount<r.imageLimit}static incrementUsage(e){const t=this.getCurrentUser();if(!t)return;const r={totalRequests:t.usage.totalRequests+1};e==="text"?r.textCount=t.usage.textCount+1:r.imageCount=t.usage.imageCount+1,this.updateUsage(r)}static logout(){q.remove(K.USER)}static async getCurrentUserAsync(){try{const e=q.get(K.USER,null),{data:{user:t},error:r}=await d.auth.getUser();if(r||!t)return e;const{data:s,error:n}=await d.from("users").select("*").eq("auth_user_id",t.id).single();if(n||!s)return console.error("Failed to fetch user from Supabase:",n),e;const o={id:s.id,authUserId:s.auth_user_id,email:s.email,tier:s.tier,textCount:s.text_count||0,imageCount:s.image_count||0,textLimit:fe(s.text_limit),imageLimit:fe(s.image_limit),totalRequests:s.total_requests||0,lastReset:re(s.last_reset),hasProfileSetup:s.has_profile_setup||!1,hasSeenSplashScreens:s.has_seen_splash_screens||!1,hasSeenHowToUse:s.has_seen_how_to_use||!1,hasSeenFeaturesConnected:s.has_seen_features_connected||!1,hasSeenProFeatures:s.has_seen_pro_features||!1,pcConnected:s.pc_connected||!1,pcConnectionSkipped:s.pc_connection_skipped||!1,onboardingCompleted:s.onboarding_completed||!1,hasWelcomeMessage:s.has_welcome_message||!1,isNewUser:s.is_new_user||!1,hasUsedTrial:s.has_used_trial||!1,lastActivity:re(s.updated_at),preferences:x(s.preferences),usage:{textCount:s.text_count||0,imageCount:s.image_count||0,textLimit:fe(s.text_limit),imageLimit:fe(s.image_limit),totalRequests:s.total_requests||0,lastReset:re(s.last_reset),tier:s.tier},appState:x(s.app_state),profileData:x(s.profile_data),onboardingData:x(s.onboarding_data),behaviorData:x(s.behavior_data),feedbackData:x(s.feedback_data),usageData:x(s.usage_data),createdAt:re(s.created_at),updatedAt:re(s.updated_at)};return q.set(K.USER,o),o}catch(e){return console.error("Error in getCurrentUserAsync:",e),q.get(K.USER,null)}}static async setCurrentUserAsync(e){try{q.set(K.USER,e);const{error:t}=await d.from("users").update({tier:e.tier,text_count:e.textCount,image_count:e.imageCount,text_limit:e.textLimit,image_limit:e.imageLimit,total_requests:e.totalRequests,last_reset:new Date(e.lastReset).toISOString(),has_profile_setup:e.hasProfileSetup,has_seen_splash_screens:e.hasSeenSplashScreens,has_seen_how_to_use:e.hasSeenHowToUse,has_seen_features_connected:e.hasSeenFeaturesConnected,has_seen_pro_features:e.hasSeenProFeatures,pc_connected:e.pcConnected,pc_connection_skipped:e.pcConnectionSkipped,onboarding_completed:e.onboardingCompleted,has_welcome_message:e.hasWelcomeMessage,has_used_trial:e.hasUsedTrial,preferences:j(e.preferences),profile_data:j(e.profileData),app_state:j(e.appState),onboarding_data:j(e.onboardingData),behavior_data:j(e.behaviorData),feedback_data:j(e.feedbackData),usage_data:j(e.usageData),updated_at:new Date().toISOString()}).eq("auth_user_id",e.authUserId);t&&console.error("Failed to sync user to Supabase:",t)}catch(t){console.error("Error in setCurrentUserAsync:",t)}}static async updateUsageAsync(e){const t=await this.getCurrentUserAsync();if(!t)return;const r={...t,usage:{...t.usage,...e},textCount:e.textCount??t.textCount,imageCount:e.imageCount??t.imageCount,totalRequests:e.totalRequests??t.totalRequests,lastReset:e.lastReset??t.lastReset,updatedAt:Date.now()};await this.setCurrentUserAsync(r)}}class Rr{hasTabCommand(e){return/^@\w+/.test(e.trim())}parseTabCommand(e,t){const r=e.trim();if(!this.hasTabCommand(r))return null;const s=r.match(/^@(\w+)\s*(\\modify|\\delete)?\s*(.*)$/);if(!s)return null;const[,n,o,i]=s,c=this.findMatchingTab(n,t.subtabs||[]);if(!c)return null;let l;return o==="\\delete"?l="delete":o==="\\modify"?l="modify":l="update",{type:l,tabId:c.id,tabName:c.title,instruction:i.trim()}}findMatchingTab(e,t){const r=this.normalizeTabName(e);let s=t.find(n=>this.normalizeTabName(n.id)===r||this.normalizeTabName(n.title)===r);return s||(s=t.find(n=>this.normalizeTabName(n.id).includes(r)||this.normalizeTabName(n.title).includes(r)),s)?s:(s=t.find(n=>r.includes(this.normalizeTabName(n.id))||r.includes(this.normalizeTabName(n.title))),s||null)}normalizeTabName(e){return e.toLowerCase().replace(/[_\s-]+/g,"").replace(/[^a-z0-9]/g,"")}getAvailableTabNames(e){return!e.subtabs||e.subtabs.length===0?[]:e.subtabs.map(t=>({id:t.id,title:t.title}))}formatTabSuggestion(e,t){return`@${e}`}getCommandHelp(){return`
**Tab Commands:**
• @<tab> <text> - Update tab with new info
• @<tab> \\modify <text> - Modify/rename tab
• @<tab> \\delete - Delete tab

Example: @story_so_far The player defeated the first boss
    `.trim()}validateCommand(e){switch(e.type){case"update":if(!e.instruction)return{valid:!1,error:"Update command requires content. Example: @story_so_far The player..."};break;case"modify":if(!e.instruction)return{valid:!1,error:"Modify command requires instructions. Example: @tips \\modify Change to combat strategies"};break}return{valid:!0}}describeCommand(e){switch(e.type){case"update":return`Updating "${e.tabName}" with: ${e.instruction}`;case"modify":return`Modifying "${e.tabName}": ${e.instruction}`;case"delete":return`Deleting "${e.tabName}"`}}}const Is=new Rr;let y,se=[],et=!1,ge="",ue=null,B=null,k=null,Fe=!1,W=null;const Nr="otakonSpeechRate",Ke=async()=>{try{const a=navigator;a.wakeLock&&(ue=await a.wakeLock.request("screen"),console.log("🔒 [TTS] Wake lock acquired - screen will stay on"),ue.addEventListener("release",()=>{console.log("🔓 [TTS] Wake lock released"),y&&y.speaking&&!Fe&&Ke()}))}catch(a){console.warn("⚠️ [TTS] Wake lock not available:",a)}},mt=async()=>{try{ue!==null&&(await ue.release(),ue=null)}catch{}},kr=()=>{try{if(!B){const a=window,e=a.AudioContext||a.webkitAudioContext;e&&(B=new e,console.log("🔊 [TTS] Audio context initialized"))}k||(k=new Audio,k.src="data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACBhYqFbF1fdJivrJBhNjVgodDbq2EcBj+a2teleShtr9teleShtr9teleShtr9teleShtr9t",k.loop=!0,k.volume=.01,k.load(),console.log("🔇 [TTS] Silent audio initialized for background playback"))}catch(a){console.warn("⚠️ [TTS] Audio context init failed:",a)}},ht=async()=>{try{B&&B.state==="suspended"&&(await B.resume(),console.log("🔊 [TTS] Audio context resumed")),k&&(k.currentTime=0,await k.play(),console.log("🔇 [TTS] Silent audio playing for background session")),W||(W=setInterval(()=>{y&&y.speaking?B&&B.state==="suspended"&&B.resume().catch(()=>{}):W&&(clearInterval(W),W=null)},5e3))}catch(a){console.warn("⚠️ [TTS] Silent audio start failed:",a)}},pt=()=>{try{k&&(k.pause(),k.currentTime=0,console.log("🔇 [TTS] Silent audio stopped")),W&&(clearInterval(W),W=null)}catch(a){console.warn("⚠️ [TTS] Silent audio stop failed:",a)}},Gr=()=>new Promise((a,e)=>{if(!y)return e(new Error("Speech synthesis not initialized."));if(se=y.getVoices(),se.length>0){a();return}y.onvoiceschanged=()=>{se=y.getVoices(),a()},setTimeout(()=>{se.length===0&&(se=y.getVoices()),a()},1e3)}),me=()=>{y&&y.speaking&&y.cancel(),ge="","mediaSession"in navigator&&navigator.mediaSession.playbackState!=="none"&&(navigator.mediaSession.playbackState="paused"),mt(),pt(),window.dispatchEvent(new CustomEvent("otakon:ttsStopped"))},Pr=()=>{y&&y.speaking&&!y.paused&&(y.pause(),"mediaSession"in navigator&&(navigator.mediaSession.playbackState="paused"),window.dispatchEvent(new CustomEvent("otakon:ttsPaused")))},Mr=()=>{y&&y.paused&&(y.resume(),"mediaSession"in navigator&&(navigator.mediaSession.playbackState="playing"),window.dispatchEvent(new CustomEvent("otakon:ttsResumed")))},Dr=async()=>{ge&&(me(),await St(ge))},Ur=()=>y?y.speaking:!1,tt=()=>{me(),window.dispatchEvent(new CustomEvent("otakon:disableHandsFree"))},xr=()=>{"mediaSession"in navigator&&(navigator.mediaSession.setActionHandler("play",()=>{}),navigator.mediaSession.setActionHandler("pause",tt),navigator.mediaSession.setActionHandler("stop",tt))},Lr=async()=>{document.hidden?(Fe=!0,console.log("📱 [TTS] App went to background, isSpeaking:",y==null?void 0:y.speaking),y&&y.speaking&&(await ht(),y.paused||setTimeout(()=>{y&&y.speaking&&!y.paused&&console.log("📱 [TTS] Nudging speech synthesis to stay alive")},100))):(Fe=!1,console.log("📱 [TTS] App came to foreground, isSpeaking:",y==null?void 0:y.speaking),y&&y.speaking&&await Ke())},$r=async()=>{if(typeof window<"u"&&"speechSynthesis"in window){if(et)return;et=!0,y=window.speechSynthesis,await Gr(),xr(),kr(),document.addEventListener("visibilitychange",Lr),y.getVoices().length===0&&y.speak(new SpeechSynthesisUtterance(""))}},ft=()=>se.filter(a=>a.lang.startsWith("en-")),St=async a=>new Promise((e,t)=>{try{if(!y)return console.error("Text-to-Speech is not available on this browser."),t(new Error("Text-to-Speech is not available on this browser."));if(!a.trim())return e();me(),ge=a;const r=new SpeechSynthesisUtterance(a),s=localStorage.getItem(Nr);r.rate=s?parseFloat(s):.94;const n=localStorage.getItem("otakonPreferredVoiceURI"),o=ft();let i;if(n&&(i=o.find(c=>c.voiceURI===n)),!i&&o.length>0){const c=o.find(l=>l.name.toLowerCase().includes("female"));c?i=c:i=o[0]}i&&(r.voice=i),r.onstart=async()=>{await Ke(),await ht(),"serviceWorker"in navigator&&navigator.serviceWorker.controller&&navigator.serviceWorker.controller.postMessage({type:"TTS_STARTED"}),"mediaSession"in navigator&&(navigator.mediaSession.playbackState="playing",navigator.mediaSession.metadata=new MediaMetadata({title:a.length>50?a.substring(0,50)+"...":a,artist:"Your AI Gaming Companion",album:"Otakon",artwork:[{src:"/icon-192.png",sizes:"192x192",type:"image/png"},{src:"/icon-512.png",sizes:"512x512",type:"image/png"}]})),window.dispatchEvent(new CustomEvent("otakon:ttsStarted"))},r.onend=()=>{ge="","mediaSession"in navigator&&(navigator.mediaSession.playbackState="paused"),"serviceWorker"in navigator&&navigator.serviceWorker.controller&&navigator.serviceWorker.controller.postMessage({type:"TTS_STOPPED"}),mt(),pt(),window.dispatchEvent(new CustomEvent("otakon:ttsStopped")),e()},r.onerror=c=>{console.error("SpeechSynthesis Utterance Error",c),me(),t(c)},y.speak(r)}catch(r){console.error("TTS Error:",r),t(r)}}),Rs={init:$r,getAvailableVoices:ft,speak:St,cancel:me,pause:Pr,resume:Mr,restart:Dr,isSpeaking:Ur};class rt{static async acquireMigrationLock(e,t){const r=[e,t].sort().join("|");return this.activeMigrations.has(r)?(console.warn("🔒 [MessageRouting] Migration already in progress:",r),!1):(this.activeMigrations.add(r),setTimeout(()=>{this.activeMigrations.delete(r)},this.LOCK_TIMEOUT),!0)}static releaseMigrationLock(e,t){const r=[e,t].sort().join("|");this.activeMigrations.delete(r)}static async migrateMessagesAtomic(e,t,r){var n,o,i,c;if(console.error("📦 [MessageRouting] Migration requested:",{messageIds:e,from:t,to:r}),!await this.acquireMigrationLock(t,r)){console.warn("⚠️ [MessageRouting] Skipping migration - another migration in progress");return}try{console.error("📦 [MessageRouting] Lock acquired, starting migration");const l=await A.getConversations(!1);console.error("📦 [MessageRouting] Loaded conversations:",Object.keys(l));const u=l[t],m=l[r];if(!u)throw console.error("📦 [MessageRouting] Source conversation not found:",t),console.error("📦 [MessageRouting] Available conversations:",Object.keys(l)),new Error(`Source conversation ${t} not found`);if(!m)throw console.error("📦 [MessageRouting] Destination conversation not found:",r),console.error("📦 [MessageRouting] Available conversations:",Object.keys(l)),new Error(`Destination conversation ${r} not found`);console.error("📦 [MessageRouting] Source messages:",(n=u.messages)==null?void 0:n.map(g=>({id:g.id,role:g.role}))),console.error("📦 [MessageRouting] Destination messages before:",(o=m.messages)==null?void 0:o.map(g=>({id:g.id,role:g.role})));const p=u.messages.filter(g=>e.includes(g.id));if(console.error("📦 [MessageRouting] Messages to move:",p.map(g=>({id:g.id,role:g.role}))),p.length===0){console.error("📦 [MessageRouting] No messages found to migrate");return}const f=p.filter(g=>!m.messages.some(_=>_.id===g.id));console.error("📦 [MessageRouting] Messages to add (after duplicate check):",f.map(g=>({id:g.id,role:g.role})));const{FEATURE_FLAGS:C}=await je(async()=>{const{FEATURE_FLAGS:g}=await import("./chat-services-D8MNpsFF.js").then(_=>_.c);return{FEATURE_FLAGS:g}},__vite__mapDeps([0,1,2,3,4,5,6,7]));if(C.USE_NORMALIZED_MESSAGES&&f.length>0)try{console.error("🔄 [MessageRouting] Updating conversation_id in database for",f.length,"messages");const{supabase:g}=await je(async()=>{const{supabase:U}=await import("./auth-bueVZ83V.js").then(qe=>qe.a);return{supabase:U}},__vite__mapDeps([3,4,5,6,7,2,0,1])),_=f.map(U=>U.id),{error:N}=await g.from("messages").update({conversation_id:r}).in("id",_);if(N)throw console.error("❌ [MessageRouting] Failed to update conversation_id in database:",N),N;console.error("✅ [MessageRouting] Database conversation_id updated for",_.length,"messages")}catch(g){throw console.error("❌ [MessageRouting] Database migration failed:",g),g}const h={...l,[r]:{...m,messages:[...m.messages,...f],updatedAt:Date.now()},[t]:{...u,messages:u.messages.filter(g=>!e.includes(g.id)),updatedAt:Date.now()}};console.error("📦 [MessageRouting] Updated source messages:",(i=h[t].messages)==null?void 0:i.map(g=>({id:g.id,role:g.role}))),console.error("📦 [MessageRouting] Updated destination messages:",(c=h[r].messages)==null?void 0:c.map(g=>({id:g.id,role:g.role}))),await A.setConversations(h),console.error("✅ [MessageRouting] Migration complete, conversations saved")}finally{this.releaseMigrationLock(t,r)}}static shouldRouteMessage(e,t,r){return!t||e===t?!1:!!(r&&t)}static messageExists(e,t){return e.some(r=>r.id===t)}}S(rt,"activeMigrations",new Set),S(rt,"LOCK_TIMEOUT",1e4);const Fr="otagon-offline-db",Br=1,w={MESSAGES:"pending-messages",VOICE:"pending-voice",IMAGES:"pending-images",SYNC_META:"sync-metadata"};class Wr{constructor(){S(this,"db",null);S(this,"isSupported",!0);S(this,"initPromise",null);S(this,"MAX_QUEUE_SIZE",10);typeof indexedDB>"u"&&(console.warn("[IndexedDB] Not supported, falling back to localStorage"),this.isSupported=!1)}async init(){if(this.isSupported&&!this.db)return this.initPromise?this.initPromise:(this.initPromise=new Promise((e,t)=>{try{const r=indexedDB.open(Fr,Br);r.onerror=()=>{console.error("[IndexedDB] Failed to open database:",r.error),this.isSupported=!1,e()},r.onsuccess=()=>{this.db=r.result,console.log("[IndexedDB] Database opened successfully"),e()},r.onupgradeneeded=s=>{const n=s.target.result;if(!n.objectStoreNames.contains(w.MESSAGES)){const o=n.createObjectStore(w.MESSAGES,{keyPath:"id"});o.createIndex("conversationId","conversationId",{unique:!1}),o.createIndex("timestamp","timestamp",{unique:!1})}n.objectStoreNames.contains(w.VOICE)||n.createObjectStore(w.VOICE,{keyPath:"id"}),n.objectStoreNames.contains(w.IMAGES)||n.createObjectStore(w.IMAGES,{keyPath:"id"}).createIndex("conversationId","conversationId",{unique:!1}),n.objectStoreNames.contains(w.SYNC_META)||n.createObjectStore(w.SYNC_META,{keyPath:"id"}),console.log("[IndexedDB] Database schema created/upgraded")}}catch(r){console.error("[IndexedDB] Initialization error:",r),this.isSupported=!1,e()}}),this.initPromise)}async canQueueMessage(){return await this.getPendingMessageCount()>=this.MAX_QUEUE_SIZE?{allowed:!1,reason:`Offline queue is full (${this.MAX_QUEUE_SIZE} messages). Please wait for connection to restore.`}:{allowed:!0}}async queueMessage(e){await this.init();const t={...e,id:`msg_${Date.now()}_${Math.random().toString(36).substring(7)}`,timestamp:Date.now(),retryCount:0};return!this.isSupported||!this.db?this.queueMessageToLocalStorage(t):new Promise((r,s)=>{try{if(!this.db){r(this.queueMessageToLocalStorage(t));return}const i=this.db.transaction([w.MESSAGES],"readwrite").objectStore(w.MESSAGES).add(t);i.onsuccess=()=>{console.log("[IndexedDB] Message queued:",t.id),r(t.id)},i.onerror=()=>{console.error("[IndexedDB] Failed to queue message:",i.error),r(this.queueMessageToLocalStorage(t))}}catch(n){console.error("[IndexedDB] Error queuing message:",n),r(this.queueMessageToLocalStorage(t))}})}async getPendingMessages(){return await this.init(),!this.isSupported||!this.db?this.getPendingMessagesFromLocalStorage():new Promise(e=>{try{if(!this.db){e(this.getPendingMessagesFromLocalStorage());return}const s=this.db.transaction([w.MESSAGES],"readonly").objectStore(w.MESSAGES).getAll();s.onsuccess=()=>{e(s.result||[])},s.onerror=()=>{console.error("[IndexedDB] Failed to get messages:",s.error),e(this.getPendingMessagesFromLocalStorage())}}catch(t){console.error("[IndexedDB] Error getting messages:",t),e(this.getPendingMessagesFromLocalStorage())}})}async getPendingMessageCount(){return await this.init(),!this.isSupported||!this.db?this.getPendingMessagesFromLocalStorage().length:new Promise(e=>{try{if(!this.db){e(this.getPendingMessagesFromLocalStorage().length);return}const s=this.db.transaction([w.MESSAGES],"readonly").objectStore(w.MESSAGES).count();s.onsuccess=()=>{e(s.result)},s.onerror=()=>{e(this.getPendingMessagesFromLocalStorage().length)}}catch{e(this.getPendingMessagesFromLocalStorage().length)}})}async removeMessage(e){return await this.init(),!this.isSupported||!this.db?this.removeMessageFromLocalStorage(e):new Promise(t=>{try{if(!this.db){t(this.removeMessageFromLocalStorage(e));return}const n=this.db.transaction([w.MESSAGES],"readwrite").objectStore(w.MESSAGES).delete(e);n.onsuccess=()=>{console.log("[IndexedDB] Message removed:",e),t(!0)},n.onerror=()=>{console.error("[IndexedDB] Failed to remove message:",n.error),t(this.removeMessageFromLocalStorage(e))}}catch(r){console.error("[IndexedDB] Error removing message:",r),t(this.removeMessageFromLocalStorage(e))}})}async clearAllMessages(){if(await this.init(),!this.isSupported||!this.db){localStorage.removeItem("otakon_pending_messages");return}return new Promise(e=>{try{if(!this.db){localStorage.removeItem("otakon_pending_messages"),e();return}const s=this.db.transaction([w.MESSAGES],"readwrite").objectStore(w.MESSAGES).clear();s.onsuccess=()=>{console.log("[IndexedDB] All messages cleared"),e()},s.onerror=()=>{console.error("[IndexedDB] Failed to clear messages:",s.error),localStorage.removeItem("otakon_pending_messages"),e()}}catch{localStorage.removeItem("otakon_pending_messages"),e()}})}async queueImage(e){await this.init();const t={...e,id:`img_${Date.now()}_${Math.random().toString(36).substring(7)}`,timestamp:Date.now()};return!this.isSupported||!this.db?(console.warn("[IndexedDB] Cannot queue large image data to localStorage"),null):new Promise(r=>{try{if(!this.db){r(null);return}const o=this.db.transaction([w.IMAGES],"readwrite").objectStore(w.IMAGES).add(t);o.onsuccess=()=>{console.log("[IndexedDB] Image queued:",t.id),r(t.id)},o.onerror=()=>{console.error("[IndexedDB] Failed to queue image:",o.error),r(null)}}catch(s){console.error("[IndexedDB] Error queuing image:",s),r(null)}})}async getPendingImages(){return await this.init(),!this.isSupported||!this.db?[]:new Promise(e=>{try{if(!this.db){e([]);return}const s=this.db.transaction([w.IMAGES],"readonly").objectStore(w.IMAGES).getAll();s.onsuccess=()=>{e(s.result||[])},s.onerror=()=>{e([])}}catch{e([])}})}async clearAllImages(){if(await this.init(),!(!this.isSupported||!this.db))return new Promise(e=>{try{if(!this.db){e();return}this.db.transaction([w.IMAGES],"readwrite").objectStore(w.IMAGES).clear(),e()}catch{e()}})}queueMessageToLocalStorage(e){try{const t=this.getPendingMessagesFromLocalStorage();return t.push(e),localStorage.setItem("otakon_pending_messages",JSON.stringify(t)),console.log("[IndexedDB] Message queued to localStorage fallback:",e.id),e.id}catch(t){return console.error("[IndexedDB] localStorage fallback failed:",t),e.id}}getPendingMessagesFromLocalStorage(){try{const e=localStorage.getItem("otakon_pending_messages");return e?JSON.parse(e):[]}catch{return[]}}removeMessageFromLocalStorage(e){try{const r=this.getPendingMessagesFromLocalStorage().filter(s=>s.id!==e);return localStorage.setItem("otakon_pending_messages",JSON.stringify(r)),!0}catch{return!1}}async updateSyncMetadata(e){await this.init();const t={lastSyncAttempt:e.lastSyncAttempt||Date.now(),pendingCount:e.pendingCount||0,lastSuccessfulSync:e.lastSuccessfulSync||0};if(!this.isSupported||!this.db){localStorage.setItem("otakon_sync_metadata",JSON.stringify(t));return}return new Promise(r=>{try{if(!this.db){localStorage.setItem("otakon_sync_metadata",JSON.stringify(t)),r();return}this.db.transaction([w.SYNC_META],"readwrite").objectStore(w.SYNC_META).put({id:"sync-status",...t}),r()}catch{localStorage.setItem("otakon_sync_metadata",JSON.stringify(t)),r()}})}async getSyncMetadata(){if(await this.init(),!this.isSupported||!this.db)try{const e=localStorage.getItem("otakon_sync_metadata");return e?JSON.parse(e):null}catch{return null}return new Promise(e=>{try{if(!this.db){e(null);return}const s=this.db.transaction([w.SYNC_META],"readonly").objectStore(w.SYNC_META).get("sync-status");s.onsuccess=()=>{e(s.result||null)},s.onerror=()=>{e(null)}}catch{e(null)}})}isAvailable(){return this.isSupported&&this.db!==null}}const te=new Wr,Ns={queueMessage:a=>te.queueMessage(a),getPendingMessages:()=>te.getPendingMessages(),removePendingMessage:a=>te.removeMessage(a),clearAllMessages:()=>te.clearAllMessages(),canQueueMessage:()=>te.canQueueMessage(),getPendingMessageCount:()=>te.getPendingMessageCount()},b={LIBRARY:"otagon_gaming_library",TIMELINE:"otagon_gaming_timeline",NEWS_CACHE:"otagon_gaming_news_cache",NEWS_GENERATION_LOG:"otagon_news_generation_log",USER_PROFILE:"otagon_user_gaming_profile",GAMEPLAY_SESSIONS:"otagon_gameplay_sessions",IGDB_HOME_CACHE:"otagon_igdb_home_cache",SEARCH_HISTORY:"otagon_game_search_history"};function Ae(){var a;return((a=crypto.randomUUID)==null?void 0:a.call(crypto))||"xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g,e=>{const t=Math.random()*16|0;return(e==="x"?t:t&3|8).toString(16)})}function G(a,e){try{const t=localStorage.getItem(a);return t?JSON.parse(t):e}catch(t){return console.warn(`[GamingExplorerStorage] Error reading ${a}:`,t),e}}function I(a,e){try{return localStorage.setItem(a,JSON.stringify(e)),!0}catch(t){return console.error(`[GamingExplorerStorage] Error writing ${a}:`,t),!1}}const ks={getAll(){return G(b.LIBRARY,[])},getByCategory(a){return this.getAll().filter(t=>t.category===a)},getByIgdbId(a){return this.getAll().find(t=>t.igdbGameId===a)},getGameCategories(a){return this.getAll().filter(t=>t.igdbGameId===a).map(t=>t.category)},addGame(a,e,t,r,s){const n=this.getAll(),o=n.find(c=>c.igdbGameId===a&&c.category===t);if(o)return o.updatedAt=Date.now(),s!=null&&s.platform&&(o.platform=s.platform),s!=null&&s.personalRating&&(o.personalRating=s.personalRating),s!=null&&s.completionStatus&&(o.completionStatus=s.completionStatus),r&&(o.igdbData=r),I(b.LIBRARY,n),this.updateStats(),o;const i={id:Ae(),igdbGameId:a,gameName:e,category:t,platform:s==null?void 0:s.platform,personalRating:s==null?void 0:s.personalRating,completionStatus:(s==null?void 0:s.completionStatus)||(t==="own"?"not_started":void 0),igdbData:r,dateAdded:Date.now(),updatedAt:Date.now()};return n.push(i),I(b.LIBRARY,n),this.updateStats(),i},updateGame(a,e){const t=this.getAll(),r=t.findIndex(s=>s.id===a);return r===-1?null:(t[r]={...t[r],...e,updatedAt:Date.now()},I(b.LIBRARY,t),this.updateStats(),t[r])},removeGame(a,e){const t=this.getAll(),r=t.filter(s=>!(s.igdbGameId===a&&s.category===e));return r.length===t.length?!1:(I(b.LIBRARY,r),this.updateStats(),!0)},moveGame(a,e,t){const r=this.getAll(),s=r.find(n=>n.igdbGameId===a&&n.category===e);return s?(s.category=t,s.updatedAt=Date.now(),I(b.LIBRARY,r),this.updateStats(),!0):!1},toggleCategory(a,e,t,r){return this.getAll().find(o=>o.igdbGameId===a&&o.category===t)?(this.removeGame(a,t),{added:!1}):{added:!0,item:this.addGame(a,e,t,r)}},updateStats(){const a=this.getAll(),e=st.get();e.libraryStats={ownedCount:a.filter(t=>t.category==="own").length,completedCount:a.filter(t=>t.category==="own"&&t.completionStatus==="completed").length,wishlistCount:a.filter(t=>t.category==="wishlist").length,favoritesCount:a.filter(t=>t.category==="favorite").length,dislikedCount:a.filter(t=>t.category==="disliked").length,totalHoursPlayed:a.reduce((t,r)=>t+(r.hoursPlayed||0),0)},e.lastUpdated=Date.now(),st.save(e)}},Gs={getAll(){return G(b.TIMELINE,[]).sort((e,t)=>new Date(t.eventDate).getTime()-new Date(e.eventDate).getTime())},getByYear(a){return this.getAll().filter(t=>t.year===a)},getYears(){const a=this.getAll();return[...new Set(a.map(t=>t.year))].sort((t,r)=>r-t)},addEvent(a){const e=this.getAll(),t={...a,id:Ae(),createdAt:Date.now(),updatedAt:Date.now()};return e.push(t),I(b.TIMELINE,e),t},updateEvent(a,e){const t=G(b.TIMELINE,[]),r=t.findIndex(s=>s.id===a);return r===-1?null:(t[r]={...t[r],...e,updatedAt:Date.now()},I(b.TIMELINE,t),t[r])},deleteEvent(a){const e=G(b.TIMELINE,[]),t=e.filter(r=>r.id!==a);return t.length===e.length?!1:(I(b.TIMELINE,t),!0)},addConsole(a,e,t,r){return this.addEvent({type:"console",eventDate:`${e}-01-01`,year:e,title:a,description:t,photos:r?[r]:void 0})},addPCBuild(a,e,t,r){return this.addEvent({type:"pc_build",eventDate:`${e}-01-01`,year:e,title:a,specs:t,photos:r})},addGameMilestone(a,e,t,r,s){return this.addEvent({type:"game",eventDate:`${t}-01-01`,year:t,title:a,description:r,igdbGameId:e,igdbData:s})}},Ps={getAll(){return G(b.GAMEPLAY_SESSIONS,[])},getByGame(a){return this.getAll().filter(t=>t.igdbGameId===a)},getByDateAndGame(a,e){return this.getAll().find(r=>r.sessionDate===a&&r.igdbGameId===e)},addScreenshot(a,e,t){const r=this.getAll(),s=new Date().toISOString().split("T")[0];let n=r.find(i=>i.sessionDate===s&&i.igdbGameId===a);n||(n={id:Ae(),igdbGameId:a,gameName:e,sessionDate:s,screenshots:[],createdAt:Date.now()},r.push(n));const o={...t,id:Ae(),sessionId:n.id};return n.screenshots.push(o),I(b.GAMEPLAY_SESSIONS,r),n},getScreenshotCount(a){return this.getByGame(a).reduce((t,r)=>t+r.screenshots.length,0)}},Ms={get(a){const t=G(b.NEWS_CACHE,[]).find(r=>r.promptType===a);return t&&t.expiresAt>Date.now()?t:null},save(a){const e=G(b.NEWS_CACHE,[]),t=e.findIndex(r=>r.promptType===a.promptType);t>=0?e[t]=a:e.push(a),I(b.NEWS_CACHE,e)},canGenerate(a,e){const t=G(b.NEWS_GENERATION_LOG,[]),r=Date.now()-1440*60*1e3,s=t.find(n=>n.userId===a&&n.promptType===e&&n.generatedAt>r);return s?{allowed:!1,nextAvailableAt:s.generatedAt+1440*60*1e3}:{allowed:!0}},logGeneration(a,e){const r=G(b.NEWS_GENERATION_LOG,[]).filter(s=>!(s.userId===a&&s.promptType===e));r.push({userId:a,promptType:e,generatedAt:Date.now()}),I(b.NEWS_GENERATION_LOG,r)},getCacheAge(a){const e=this.get(a);return e?Math.floor((Date.now()-e.cachedAt)/(3600*1e3)):null}},st={get(){return G(b.USER_PROFILE,{libraryStats:{ownedCount:0,completedCount:0,wishlistCount:0,favoritesCount:0,dislikedCount:0,totalHoursPlayed:0},lastUpdated:Date.now()})},save(a){I(b.USER_PROFILE,a)},setGamingStartYear(a){const e=this.get();e.gamingStartYear=a,e.lastUpdated=Date.now(),this.save(e)},getGamingStartYear(){return this.get().gamingStartYear},needsOnboarding(){return this.get().gamingStartYear===void 0}},Hr=1440*60*1e3,Ds={get(){const a=G(b.IGDB_HOME_CACHE,null);return a?Date.now()-a.cachedAt>Hr?(this.clear(),null):a:null},set(a){const e={...a,cachedAt:Date.now()};I(b.IGDB_HOME_CACHE,e)},clear(){localStorage.removeItem(b.IGDB_HOME_CACHE)},isValid(){return this.get()!==null}},Kr=12,Us={getAll(){return G(b.SEARCH_HISTORY,[])},getGames(){return this.getAll().map(a=>a.gameData)},add(a){const t=this.getAll().filter(s=>s.gameData.id!==a.id),r=[{gameData:a,searchedAt:Date.now()},...t].slice(0,Kr);I(b.SEARCH_HISTORY,r)},remove(a){const t=this.getAll().filter(r=>r.gameData.id!==a);I(b.SEARCH_HISTORY,t)},clear(){localStorage.removeItem(b.SEARCH_HISTORY)},hasHistory(){return this.getAll().length>0}},ee=class ee{static getInstance(){return ee.instance||(ee.instance=new ee),ee.instance}async getMessages(e){return pe.USE_NORMALIZED_MESSAGES?this.getMessagesFromTable(e):this.getMessagesFromJsonb(e)}async addMessage(e,t){return pe.USE_NORMALIZED_MESSAGES?this.addMessageToTable(e,t):this.addMessageToJsonb(e,t)}async updateMessage(e,t,r){return pe.USE_NORMALIZED_MESSAGES?this.updateMessageInTable(t,r):this.updateMessageInJsonb(e,t,r)}async deleteMessage(e,t){return pe.USE_NORMALIZED_MESSAGES?this.deleteMessageFromTable(t):this.deleteMessageFromJsonb(e,t)}async getMessagesFromTable(e){try{const{data:t,error:r}=await d.rpc("get_conversation_messages",{p_conversation_id:e});return r?(console.error("Error getting messages from table:",r),[]):(t||[]).map(s=>({id:s.id,role:s.role,content:s.content,timestamp:new Date(s.created_at).getTime(),imageUrl:s.image_url||void 0,metadata:x(s.metadata)}))}catch(t){return console.error("Error getting messages from table:",t),[]}}async addMessageToTable(e,t){var n,o;const s=[0,1e3,2e3];for(let i=0;i<3;i++)try{i>0&&(await new Promise(p=>setTimeout(p,s[i])),console.warn(`🔄 [MessageService] Retry attempt ${i+1}/3`));const{data:c,error:l}=await d.rpc("add_message",{p_conversation_id:e,p_role:t.role,p_content:t.content,p_image_url:ke(t.imageUrl,void 0),p_metadata:Se(t.metadata||{})});if(l){if(i<2&&(l.code==="PGRST301"||(n=l.message)!=null&&n.includes("timeout")||(o=l.message)!=null&&o.includes("network"))){console.warn("⚠️ [MessageService] Transient error, will retry:",l);continue}throw new Error(`Failed to add message: ${l.message} (code: ${l.code})`)}const{data:u,error:m}=await d.from("messages").select("*").eq("id",c).single();if(m)throw new Error(`Failed to fetch new message: ${m.message}`);if(!u)throw new Error("Message not found after insert - database inconsistency");return{id:u.id,role:u.role,content:u.content,timestamp:re(u.created_at),imageUrl:ke(u.image_url,void 0),metadata:x(u.metadata)}}catch(c){if(i===2)throw console.error("❌ [MessageService] All retry attempts exhausted:",c),c}throw new Error("Unexpected: retry loop completed without result")}async updateMessageInTable(e,t){try{const r={};t.content!==void 0&&(r.content=t.content),t.imageUrl!==void 0&&(r.image_url=t.imageUrl),t.metadata!==void 0&&(r.metadata=t.metadata);const{error:s}=await d.from("messages").update(r).eq("id",e);return s?(console.error("Error updating message in table:",s),!1):!0}catch(r){return console.error("Error updating message in table:",r),!1}}async deleteMessageFromTable(e){try{const{error:t}=await d.from("messages").delete().eq("id",e);return t?(console.error("Error deleting message from table:",t),!1):!0}catch(t){return console.error("Error deleting message from table:",t),!1}}async getMessagesFromJsonb(e){try{const{data:t,error:r}=await d.from("conversations").select("messages").eq("id",e).single();return r?(console.error("Error getting messages from JSONB:",r),[]):Array.isArray(t==null?void 0:t.messages)?t.messages:[]}catch(t){return console.error("Error getting messages from JSONB:",t),[]}}async addMessageToJsonb(e,t){try{const r=await this.getMessagesFromJsonb(e),s={...t,id:`${Date.now()}-${Math.random().toString(36).substr(2,9)}`,timestamp:Date.now()},{error:n}=await d.from("conversations").update({messages:Se([...r,s]),updated_at:new Date().toISOString()}).eq("id",e);return n?(console.error("Error adding message to JSONB:",n),null):s}catch(r){return console.error("Error adding message to JSONB:",r),null}}async updateMessageInJsonb(e,t,r){try{const n=(await this.getMessagesFromJsonb(e)).map(i=>i.id===t?{...i,...r}:i),{error:o}=await d.from("conversations").update({messages:Se(n),updated_at:new Date().toISOString()}).eq("id",e);return o?(console.error("Error updating message in JSONB:",o),!1):!0}catch(s){return console.error("Error updating message in JSONB:",s),!1}}async deleteMessageFromJsonb(e,t){try{const s=(await this.getMessagesFromJsonb(e)).filter(o=>o.id!==t),{error:n}=await d.from("conversations").update({messages:Se(s),updated_at:new Date().toISOString()}).eq("id",e);return n?(console.error("Error deleting message from JSONB:",n),!1):!0}catch(r){return console.error("Error deleting message from JSONB:",r),!1}}async migrateMessagesToTable(){try{const{data:e,error:t}=await d.rpc("migrate_messages_to_table");return t?(console.error("Error migrating messages:",t),{conversationsProcessed:0,messagesCreated:0,errors:1}):{conversationsProcessed:e[0].conversations_processed,messagesCreated:e[0].messages_created,errors:e[0].errors}}catch(e){return console.error("Error migrating messages:",e),{conversationsProcessed:0,messagesCreated:0,errors:1}}}async rollbackMessagesToJsonb(){try{const{data:e,error:t}=await d.rpc("rollback_messages_to_jsonb");return t?(console.error("Error rolling back messages:",t),{conversationsUpdated:0,errors:1}):{conversationsUpdated:e[0].conversations_updated,errors:e[0].errors}}catch(e){return console.error("Error rolling back messages:",e),{conversationsUpdated:0,errors:1}}}};S(ee,"instance");let Ce=ee;Ce.getInstance();const xs=Object.freeze(Object.defineProperty({__proto__:null,MessageService:Ce},Symbol.toStringTag,{value:"Module"}));class qr{constructor(){S(this,"submittedFeedback",new Set)}hasSubmittedFeedback(e){return this.submittedFeedback.has(e)}async submitFeedback(e){try{const t=ye.getCurrentUser();if(!(t!=null&&t.authUserId))return console.warn("[FeedbackService] User not authenticated"),{success:!1,error:"User not authenticated"};if(this.submittedFeedback.has(e.messageId))return console.log("[FeedbackService] Feedback already submitted for message:",e.messageId),{success:!0};const{error:r}=await d.from("ai_feedback").insert({user_id:t.authUserId,conversation_id:e.conversationId,message_id:e.messageId,feedback_type:e.feedbackType,content_type:e.contentType,category:e.category||null,comment:e.comment||null});return r?r.code==="23505"?(console.log("[FeedbackService] Feedback already exists in database"),this.submittedFeedback.add(e.messageId),{success:!0}):(console.error("[FeedbackService] Failed to submit feedback:",r),{success:!1,error:r.message}):(this.submittedFeedback.add(e.messageId),console.log("[FeedbackService] Feedback submitted:",{messageId:e.messageId,type:e.feedbackType,contentType:e.contentType}),{success:!0})}catch(t){return console.error("[FeedbackService] Error submitting feedback:",t),{success:!1,error:"Failed to submit feedback"}}}async submitPositiveFeedback(e,t,r="message"){return this.submitFeedback({messageId:e,conversationId:t,feedbackType:"up",contentType:r})}async submitNegativeFeedback(e,t,r,s,n="message"){return this.submitFeedback({messageId:e,conversationId:t,feedbackType:"down",contentType:n,category:r,comment:s})}async submitCorrection(e){try{const t=ye.getCurrentUser();if(!(t!=null&&t.authUserId))return console.warn("[FeedbackService] User not authenticated for correction"),{success:!1,error:"User not authenticated"};if(!z.getRateLimitStatus().allowed)return{success:!1,error:"Daily correction limit reached. Try again tomorrow.",rateLimitRemaining:0};const s={originalResponse:e.originalResponse,correctionText:e.correctionText,type:e.correctionType,scope:e.correctionScope,gameTitle:e.gameTitle,messageId:e.messageId,conversationId:e.conversationId},n=await z.submitCorrection(t.authUserId,s);return n.success?(console.log("[FeedbackService] Correction submitted successfully:",{messageId:e.messageId,type:e.correctionType,scope:e.correctionScope}),{success:!0,correction:n.correction,rateLimitRemaining:z.getRateLimitStatus().remaining}):{success:!1,error:n.error,rateLimitRemaining:z.getRateLimitStatus().remaining}}catch(t){return console.error("[FeedbackService] Error submitting correction:",t),{success:!1,error:"Failed to submit correction"}}}getCorrectionRateLimit(){return z.getRateLimitStatus()}async getUserCorrections(){const e=ye.getCurrentUser();return e!=null&&e.authUserId?z.getAllCorrections(e.authUserId):[]}async toggleCorrection(e,t){const r=ye.getCurrentUser();return r!=null&&r.authUserId?z.toggleCorrection(r.authUserId,e,t):!1}async getFeedbackStats(){try{const{data:e,error:t}=await d.from("ai_feedback").select("feedback_type, category");if(t)return console.error("[FeedbackService] Failed to get feedback stats:",t),null;const r={totalFeedback:e.length,positiveCount:e.filter(s=>s.feedback_type==="up").length,negativeCount:e.filter(s=>s.feedback_type==="down").length,categoryBreakdown:{}};return e.forEach(s=>{s.category&&(r.categoryBreakdown[s.category]=(r.categoryBreakdown[s.category]||0)+1)}),r}catch(e){return console.error("[FeedbackService] Error getting feedback stats:",e),null}}clearLocalTracking(){this.submittedFeedback.clear()}}const zr=new qr,Ls=Object.freeze(Object.defineProperty({__proto__:null,feedbackService:zr},Symbol.toStringTag,{value:"Module"}));function Yr(a){var o;const e=a.split(","),t=((o=e[0].match(/:(.*?);/))==null?void 0:o[1])||"image/png",r=atob(e[1]),s=r.length,n=new Uint8Array(s);for(let i=0;i<s;i++)n[i]=r.charCodeAt(i);return new Blob([n],{type:t})}async function jr(a,e){try{const t=Yr(a),r=t.size,s=50*1024*1024;if(r>s)return{success:!1,error:"Screenshot exceeds 50MB size limit"};const n=Date.now(),o=Math.random().toString(36).substring(2,15),i=`${n}_${o}.png`,c=`${e}/${i}`,{error:l}=await d.storage.from("screenshots").upload(c,t,{contentType:"image/png",cacheControl:"3600",upsert:!1});if(l)return console.error("Screenshot upload error:",l),{success:!1,error:l.message};const{data:u}=d.storage.from("screenshots").getPublicUrl(c);return u!=null&&u.publicUrl?{success:!0,publicUrl:u.publicUrl,fileSize:r}:{success:!1,error:"Failed to generate public URL"}}catch(t){return console.error("Screenshot upload exception:",t),{success:!1,error:t instanceof Error?t.message:"Unknown error"}}}const $s=Object.freeze(Object.defineProperty({__proto__:null,uploadScreenshot:jr},Symbol.toStringTag,{value:"Module"}));class Vr{constructor(){S(this,"MAX_WORDS",300);S(this,"RECENT_MESSAGE_COUNT",8)}countWords(e){return e.trim().split(/\s+/).filter(t=>t.length>0).length}getTotalWordCount(e){return e.reduce((t,r)=>{const s=this.countWords(r.content);return t+s},0)}shouldSummarize(e){return!e.messages||e.messages.length<=this.RECENT_MESSAGE_COUNT?!1:this.getTotalWordCount(e.messages)>this.MAX_WORDS*3}splitMessages(e){if(e.length<=this.RECENT_MESSAGE_COUNT)return{toSummarize:[],toKeep:e};const t=e.length-this.RECENT_MESSAGE_COUNT;return{toSummarize:e.slice(0,t),toKeep:e.slice(t)}}async summarizeMessages(e,t,r){const s=this.getTotalWordCount(e),n=e.map(c=>`${c.role==="user"?"User":"Assistant"}: ${c.content}`).join(`

`),i=`${t&&r?`This is a conversation about "${t}" (${r}).`:"This is a general conversation."}

Please provide a concise summary of the following conversation history. Focus on:
- Key topics discussed
- Important decisions or choices made
- Game progress or story developments (if applicable)
- User preferences or interests mentioned

Keep the summary under ${this.MAX_WORDS} words while preserving essential context.

Conversation to summarize:
${n}

Provide ONLY the summary, no additional commentary.`;try{const c={id:"temp-summary",title:"Summary Request",messages:[{id:"summary-msg-"+Date.now(),role:"user",content:i,timestamp:Date.now()}],createdAt:Date.now(),updatedAt:Date.now(),isActive:!1,isGameHub:!1},l={id:"system",email:"system@otakon.ai",profileData:null},m=(await at.getChatResponse(c,l,i,!1,!1)).content.trim(),p=this.countWords(m);return console.log(`✅ [ContextSummarization] Summary generated: ${p} words (reduced from ${s})`),{summary:m,wordCount:p,messagesIncluded:e.length,originalWordCount:s}}catch(c){console.error("❌ [ContextSummarization] Failed to generate summary:",c);const l=e.slice(0,5).map(u=>u.content.substring(0,100)).join(" ... ").substring(0,this.MAX_WORDS*6);return{summary:`[Previous conversation context] ${l}`,wordCount:this.countWords(l),messagesIncluded:e.length,originalWordCount:s}}}async applyContextSummarization(e){if(!this.shouldSummarize(e))return e;const{toSummarize:t,toKeep:r}=this.splitMessages(e.messages);if(t.length===0)return e;const s=await this.summarizeMessages(t,e.gameTitle,e.genre),o=[{id:"summary-"+Date.now(),role:"system",content:s.summary,timestamp:t[t.length-1].timestamp,metadata:{isSummary:!0,messagesIncluded:s.messagesIncluded,originalWordCount:s.originalWordCount,summaryWordCount:s.wordCount}},...r],i=s.summary.replace(/!\[.*?\]\(data:image\/.*?\)/g,""),c=i.split(/\s+/).filter(u=>u.length>0),l=c.length>500?c.slice(0,500).join(" ")+"...":i;return console.log(`✅ [ContextSummarization] Context optimized: ${e.messages.length} messages → ${o.length} (${s.originalWordCount} words → ${s.wordCount} + recent)`),{...e,messages:o,contextSummary:l,lastSummarizedAt:Date.now(),updatedAt:Date.now()}}async getOptimizedContext(e){return this.shouldSummarize(e)?(await this.applyContextSummarization(e)).messages:e.messages}willTriggerSummarization(e){return this.getTotalWordCount(e.messages)>this.MAX_WORDS*3*.8}}const Jr=new Vr,Fs=Object.freeze(Object.defineProperty({__proto__:null,contextSummarizationService:Jr},Symbol.toStringTag,{value:"Module"}));export{$s as $,us as A,Us as B,st as C,Lt as D,be as E,Ms as F,Be as G,Ds as H,Gs as I,Ps as J,ls as K,ns as L,kt as M,Ns as N,Y as O,is as P,vs as Q,rt as R,q as S,As as T,Os as U,as as V,os as W,ts as X,rs as Y,xs as Z,Ls as _,R as a,Fs as a0,ys as b,Pt as c,Ts as d,z as e,fs as f,Es as g,L as h,ws as i,bs as j,H as k,ss as l,Rs as m,_s as n,Cs as o,Ss as p,Is as q,ks as r,Ct as s,ae as t,cs as u,hs as v,ps as w,ms as x,gs as y,ds as z};
