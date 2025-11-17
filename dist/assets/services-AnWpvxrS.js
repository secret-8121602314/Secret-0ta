var we=Object.defineProperty;var ve=(i,e,t)=>e in i?we(i,e,{enumerable:!0,configurable:!0,writable:!0,value:t}):i[e]=t;var d=(i,e,t)=>ve(i,typeof e!="symbol"?e+"":e,t);import{s as l}from"./auth-Dpug4xIU.js";import{n as Te,a as y,i as ce,b as he,S as I,U as Ce,T as le}from"./chat-services-CXK8TIjJ.js";import{b as Ee,c as M,j as N,d as z}from"./core-services-B0inzEJW.js";class _e{constructor(){d(this,"memoryCache",new Map);d(this,"DEFAULT_TTL",300*1e3);d(this,"CACHE_TABLE","app_cache");d(this,"MAX_MEMORY_CACHE_SIZE",100);d(this,"pendingRequests",new Map)}async set(e,t,s=this.DEFAULT_TTL,r="general",a){const n=Date.now()+s;this.memoryCache.set(e,{value:t,expires:n});try{console.log(`[CacheService] Storing in Supabase: ${e} (type: ${r}, user: ${a||"none"})`);const{error:c}=await l.from(this.CACHE_TABLE).upsert({key:e,value:JSON.stringify(t),expires_at:new Date(n).toISOString(),updated_at:new Date().toISOString(),cache_type:r,user_id:a||null,size_bytes:JSON.stringify(t).length})}catch{}this.memoryCache.size>this.MAX_MEMORY_CACHE_SIZE&&this.cleanupMemoryCache()}async get(e,t=!1){if(this.pendingRequests.has(e))return await this.pendingRequests.get(e);const s=this.memoryCache.get(e);if(s&&Date.now()<=s.expires)return console.log(`[CacheService] Cache HIT (memory): ${e}`),s.value;if(s&&this.memoryCache.delete(e),t)return console.log(`[CacheService] Cache MISS (memory-only mode): ${e}`),null;const r=this.fetchFromSupabase(e);this.pendingRequests.set(e,r);try{return await r}finally{this.pendingRequests.delete(e)}}async fetchFromSupabase(e){try{console.log(`[CacheService] Cache MISS (memory), trying Supabase: ${e}`);const{data:t,error:s}=await l.from(this.CACHE_TABLE).select("value, expires_at").eq("key",e).maybeSingle();if(s)return null;if(!t)return console.log(`[CacheService] Cache MISS (Supabase): ${e}`),null;const r=new Date(t.expires_at).getTime();if(Date.now()>r)return console.log(`[CacheService] Cache EXPIRED (Supabase): ${e}`),await this.delete(e),null;console.log(`[CacheService] Cache HIT (Supabase): ${e}`);const a=JSON.parse(typeof t.value=="string"?t.value:"{}");return this.memoryCache.set(e,{value:a,expires:r}),a}catch{return null}}async has(e){return await this.get(e)!==null}async delete(e){const t=this.memoryCache.delete(e);try{const{error:s}=await l.from(this.CACHE_TABLE).delete().eq("key",e)}catch{}return t}async clear(){this.memoryCache.clear(),this.pendingRequests.clear();try{const{error:e}=await l.from(this.CACHE_TABLE).delete().neq("key","never_delete")}catch{}}async cleanup(){const e=Date.now();this.cleanupMemoryCache();try{const{error:t}=await l.from(this.CACHE_TABLE).delete().lt("expires_at",new Date(e).toISOString())}catch{}}cleanupMemoryCache(){const e=Date.now(),t=Array.from(this.memoryCache.entries());t.forEach(([s,r])=>{e>r.expires&&this.memoryCache.delete(s)}),this.memoryCache.size>this.MAX_MEMORY_CACHE_SIZE&&t.filter(([a])=>this.memoryCache.has(a)).sort((a,n)=>a[1].expires-n[1].expires).slice(0,this.memoryCache.size-this.MAX_MEMORY_CACHE_SIZE).forEach(([a])=>this.memoryCache.delete(a))}getStats(){return{memorySize:this.memoryCache.size,memoryKeys:Array.from(this.memoryCache.keys())}}async getSupabaseStats(){try{const{data:e,error:t}=await l.rpc("get_cache_stats");return t?null:e}catch{return null}}async getPerformanceMetrics(){try{const{data:e,error:t}=await l.rpc("get_cache_performance_metrics");return t?null:e}catch{return null}}async getUserCacheEntries(e){try{const{data:t,error:s}=await l.rpc("get_user_cache_entries",{p_user_id:e});return s?[]:t||[]}catch{return[]}}async clearUserCache(e){try{const{data:t,error:s}=await l.rpc("clear_user_cache",{p_user_id:e});return s?0:t||0}catch{return 0}}async setChatContext(e,t){await this.set(`chat_context:${e}`,t,2160*60*60*1e3,"context",e)}async getChatContext(e){return await this.get(`chat_context:${e}`)}async setUserMemory(e,t){await this.set(`user_memory:${e}`,t,365*24*60*60*1e3,"memory",e)}async getUserMemory(e){return await this.get(`user_memory:${e}`)}async setGameContext(e,t,s){await this.set(`game_context:${e}:${t}`,s,2160*60*60*1e3,"context",e)}async getGameContext(e,t){return await this.get(`game_context:${e}:${t}`)}async setUser(e,t){await this.set(`user:${e}`,t,365*24*60*60*1e3,"user",e)}async getUser(e){return await this.get(`user:${e}`)}async setRateLimit(e,t){await this.set(`rate_limit:${e}`,t,900*1e3,"rate_limit")}async getRateLimit(e){return await this.get(`rate_limit:${e}`)}async setConversation(e,t,s){await this.set(`conversation:${e}`,t,365*24*60*60*1e3,"conversation",s)}async getConversation(e){return await this.get(`conversation:${e}`)}async initializeCacheTable(){try{const{error:e}=await l.from(this.CACHE_TABLE).select("key").limit(1);e&&e.code}catch{}}}const w=new _e;w.initializeCacheTable().catch(()=>{});setInterval(()=>{w.cleanup()},300*1e3);class j{static handle(e,t,s){this.errorCount++,!this.isErrorRateLimited()&&(console.error(`[${t}]`,{message:e.message,stack:e.stack,context:t,timestamp:new Date().toISOString(),errorCount:this.errorCount}),s&&this.showUserMessage(s),this.reportError(e,t))}static handleAuthError(e,t){const s=this.getAuthErrorMessage(t);this.handle(e,`AuthService:${t}`,s)}static handleWebSocketError(e,t){const s=this.getWebSocketErrorMessage(t);this.handle(e,`WebSocketService:${t}`,s)}static handleConversationError(e,t){const s=this.getConversationErrorMessage(t);this.handle(e,`ConversationService:${t}`,s)}static handleDatabaseError(e,t){const s=this.getDatabaseErrorMessage(t);this.handle(e,`DatabaseService:${t}`,s)}static isErrorRateLimited(){const e=Date.now();return this.recentErrors=this.recentErrors.filter(t=>e-t<this.errorWindow),this.recentErrors.push(e),this.recentErrors.length>this.maxErrorsPerMinute}static showUserMessage(e){}static reportError(e,t){console.warn("[Error Reporting] Would report error to monitoring service:",{error:e.message,context:t,timestamp:new Date().toISOString()})}static getAuthErrorMessage(e){return{signIn:"Failed to sign in. Please check your credentials and try again.",signOut:"Failed to sign out. Please try again.",loadUser:"Failed to load user data. Please refresh the page.",createUser:"Failed to create user account. Please try again.",refreshUser:"Failed to refresh user data. Please try again."}[e]||"An authentication error occurred. Please try again."}static getWebSocketErrorMessage(e){return{connect:"Failed to connect to server. Please check your internet connection.",send:"Failed to send message. Please try again.",disconnect:"Failed to disconnect. Please try again."}[e]||"A connection error occurred. Please try again."}static getConversationErrorMessage(e){return{create:"Failed to create conversation. Please try again.",load:"Failed to load conversations. Please refresh the page.",save:"Failed to save conversation. Please try again.",delete:"Failed to delete conversation. Please try again."}[e]||"A conversation error occurred. Please try again."}static getDatabaseErrorMessage(e){return{save:"Failed to save data. Please try again.",load:"Failed to load data. Please refresh the page.",update:"Failed to update data. Please try again.",delete:"Failed to delete data. Please try again."}[e]||"A database error occurred. Please try again."}static getStats(){return{totalErrors:this.errorCount,recentErrors:this.recentErrors.length,isRateLimited:this.isErrorRateLimited()}}static reset(){this.errorCount=0,this.recentErrors=[]}}d(j,"errorCount",0),d(j,"maxErrorsPerMinute",10),d(j,"errorWindow",60*1e3),d(j,"recentErrors",[]);class Ae{constructor(){d(this,"toasts",[]);d(this,"listeners",new Set);d(this,"maxToasts",5)}subscribe(e){return this.listeners.add(e),e(this.toasts),()=>{this.listeners.delete(e)}}notify(){this.listeners.forEach(e=>e([...this.toasts]))}show(e,t="info",s={}){const r=`toast-${Date.now()}-${Math.random().toString(36).substr(2,9)}`,a={id:r,message:e,type:t,duration:s.duration??this.getDefaultDuration(t),action:s.action,dismissible:s.dismissible??!0};return this.toasts.unshift(a),this.toasts.length>this.maxToasts&&(this.toasts=this.toasts.slice(0,this.maxToasts)),this.notify(),a.duration&&a.duration>0&&setTimeout(()=>this.dismiss(r),a.duration),r}success(e,t){return this.show(e,"success",{duration:3e3,...t})}error(e,t){return this.show(e,"error",{duration:7e3,dismissible:!0,...t})}warning(e,t){return this.show(e,"warning",{duration:5e3,...t})}info(e,t){return this.show(e,"info",{duration:4e3,...t})}dismiss(e){const t=this.toasts.findIndex(s=>s.id===e);t!==-1&&(this.toasts.splice(t,1),this.notify())}dismissAll(){this.toasts=[],this.notify()}getDefaultDuration(e){switch(e){case"success":return 3e3;case"error":return 7e3;case"warning":return 5e3;case"info":return 4e3;default:return 4e3}}loading(e){const t=this.show(e,"info",{duration:0,dismissible:!1});return()=>this.dismiss(t)}async promise(e,t){const s=this.loading(t.loading);try{const r=await e;s();const a=typeof t.success=="function"?t.success(r):t.success;return this.success(a),r}catch(r){s();const a=typeof t.error=="function"?t.error(r):t.error;throw this.error(a),r}}}const $=new Ae;let L=!1;typeof window<"u"&&typeof document<"u"&&(document.addEventListener("visibilitychange",()=>{L=document.hidden}),window.addEventListener("blur",()=>{L=!0}),window.addEventListener("focus",()=>{document.hidden||(L=!1)}));const Ie=async(i,e="Otagon AI")=>{if(!(!L&&!document.hidden)&&!(!("Notification"in window)||Notification.permission!=="granted"))try{const t=i.length>100?i.substring(0,97)+"...":i,s=new Notification(e,{body:t,icon:"/icon-192.png",badge:"/icon-192.png",tag:"otagon-ai-response",renotify:!0,requireInteraction:!1,silent:!1,vibrate:[200,100,200]});setTimeout(()=>s.close(),1e4),s.onclick=()=>{window.focus(),s.close()}}catch(t){console.error("Failed to show notification:",t)}},Ne=()=>L||document.hidden,lt=Object.freeze(Object.defineProperty({__proto__:null,isScreenLockedOrHidden:Ne,showAINotification:Ie,toastService:$},Symbol.toStringTag,{value:"Module"})),R=class R{constructor(){d(this,"currentSessionId",null);d(this,"sessionStartTime",null);d(this,"activityCount",0);d(this,"heartbeatInterval",null)}static getInstance(){return R.instance||(R.instance=new R),R.instance}async startSession(e,t,s){try{this.currentSessionId&&await this.endSession();const r={initialRoute:s,activityCount:0,deviceInfo:this.getDeviceInfo()},{data:a,error:n}=await l.from("user_sessions").insert({user_id:e,auth_user_id:t,started_at:new Date().toISOString(),session_data:r}).select("id").single();return n?(console.error("Failed to start session:",n),null):(this.currentSessionId=a.id,this.sessionStartTime=Date.now(),this.activityCount=0,this.startHeartbeat(),this.currentSessionId)}catch(r){return console.error("Error starting session:",r),null}}async endSession(){if(!(!this.currentSessionId||!this.sessionStartTime))try{const e=Math.floor((Date.now()-this.sessionStartTime)/1e3),{error:t}=await l.from("user_sessions").update({ended_at:new Date().toISOString(),duration_seconds:e,session_data:{activityCount:this.activityCount,lastActivity:new Date().toISOString()}}).eq("id",this.currentSessionId);t?console.error("Failed to end session:",t):console.log(`✅ Session ended: ${this.currentSessionId} (${e}s)`),this.stopHeartbeat(),this.currentSessionId=null,this.sessionStartTime=null,this.activityCount=0}catch(e){console.error("Error ending session:",e)}}trackActivity(e){this.currentSessionId&&(this.activityCount++,l.from("user_sessions").update({session_data:{activityCount:this.activityCount,lastActivity:new Date().toISOString(),lastActivityType:e}}).eq("id",this.currentSessionId).then(({error:t})=>{t&&console.error("Failed to track activity:",t)}))}async updateSessionData(e){if(this.currentSessionId)try{const{error:t}=await l.from("user_sessions").update({session_data:e}).eq("id",this.currentSessionId);t&&console.error("Failed to update session data:",t)}catch(t){console.error("Error updating session data:",t)}}getCurrentSessionId(){return this.currentSessionId}getSessionDuration(){return this.sessionStartTime?Math.floor((Date.now()-this.sessionStartTime)/1e3):0}startHeartbeat(){this.heartbeatInterval=setInterval(()=>{this.trackActivity("heartbeat")},300*1e3)}stopHeartbeat(){this.heartbeatInterval&&(clearInterval(this.heartbeatInterval),this.heartbeatInterval=null)}getDeviceInfo(){const{userAgent:e}=navigator,t=/Mobile|Android|iPhone|iPad/.test(e),s=/Tablet|iPad/.test(e);let r="desktop";return t&&!s&&(r="mobile"),s&&(r="tablet"),r}cleanup(){this.stopHeartbeat(),this.currentSessionId&&this.endSession().catch(console.error)}};d(R,"instance");let Z=R;const Oe=Z.getInstance();typeof window<"u"&&window.addEventListener("beforeunload",()=>{Oe.cleanup()});let p=null;const Re="wss://otakon-relay.onrender.com";let F=0;const Pe=5e3,Q=[];let J=null,_=null,T=null,V=!0;const ke=3e4,xe=(i,e,t,s,r)=>{if(p&&(p.readyState===WebSocket.OPEN||p.readyState===WebSocket.CONNECTING))return;if(!/^\d{6}$/.test(i)){const n="Invalid code format. Please enter a 6-digit code.";s(n),$.error(n);return}J=i,_={onOpen:e,onMessage:t,onError:s,onClose:r},V=!0;const a=`${Re}/${i}`;try{p=new WebSocket(a)}catch(n){const o=`Connection failed: ${n instanceof Error?n.message:"An unknown error occurred."}. Please check the URL and your network connection.`;s(o),$.error("PC connection failed. Please check your network and try again.");return}p.onopen=()=>{F=0,e();try{p.send(JSON.stringify({type:"connection_request",code:i,ts:Date.now()}))}catch{}for(;Q.length&&p&&p.readyState===WebSocket.OPEN;){const n=Q.shift();try{p.send(JSON.stringify(n))}catch{}}T&&(clearInterval(T),T=null),T=window.setInterval(()=>{if(p&&p.readyState===WebSocket.OPEN)try{p.send(JSON.stringify({type:"ping",ts:Date.now()}))}catch{}},ke)},p.onmessage=n=>{try{const c=JSON.parse(n.data);t(c)}catch{}},p.onerror=()=>{},p.onclose=n=>{if(n.wasClean,!n.wasClean){let c="Connection closed unexpectedly.";n.code===1006?(c="Connection to the server failed. Please check your network, verify the code, and ensure the PC client is running.",F===0&&$.warning("PC connection lost. Attempting to reconnect...")):n.reason&&(c=`Connection closed: ${n.reason}`),s(c)}if(p=null,r(),T&&(clearInterval(T),T=null),V&&J&&_){F+=1;const c=Math.min(Pe,500*Math.pow(2,F-1)),o=Math.random()*300,u=c+o;setTimeout(()=>{!p&&_&&V&&xe(J,_.onOpen,_.onMessage,_.onError,_.onClose)},u)}}},ut=i=>{p&&p.readyState===WebSocket.OPEN?p.send(JSON.stringify(i)):Q.push(i)},dt=()=>{V=!1,p&&(p.close(1e3,"User disconnected"),p=null),F=0,T&&(clearInterval(T),T=null),J=null,_=null};class ht{static async addToWaitlist(e,t="landing_page"){try{const{data:s,error:r}=await l.from("waitlist").insert({email:e,source:t,status:"pending"}).select();if(r){if(console.error("Error adding to waitlist:",r),console.error("Insert error details:",{message:r.message,code:r.code,details:r.details,hint:r.hint}),r.code==="23505")return{success:!0,alreadyExists:!0,error:"You're already on our waitlist! We'll email you when access is ready."};const{data:a,error:n}=await l.from("waitlist").select("email, status, created_at").eq("email",e).maybeSingle();return n?(console.error("Error checking existing email:",n),{success:!1,error:`Failed to add to waitlist: ${r.message}`}):a?{success:!0,alreadyExists:!0,error:"You're already on our waitlist! We'll email you when access is ready."}:{success:!1,error:`Failed to add to waitlist: ${r.message}`}}return{success:!0,alreadyExists:!1,error:void 0}}catch(s){return console.error("Waitlist service error:",s),{success:!1,error:"An unexpected error occurred"}}}static async getWaitlistCount(){try{const{count:e,error:t}=await l.from("waitlist").select("*",{count:"exact",head:!0});return t?(console.error("Error getting waitlist count:",t),{error:"Failed to get count"}):{count:e||0}}catch(e){return console.error("Error getting waitlist count:",e),{error:"Failed to get count"}}}static async getWaitlistStats(){try{const{data:e,error:t}=await l.from("waitlist").select("status");if(t)return console.error("Error fetching waitlist stats:",t),{total:137,pending:137,invited:0,converted:0};const s={total:e.length,pending:0,invited:0,converted:0};return e.forEach(r=>{const a=r.status||"pending";a==="pending"?s.pending++:a==="approved"?s.invited++:a==="rejected"&&s.converted++}),s}catch(e){return console.error("Error fetching waitlist stats:",e),{total:137,pending:137,invited:0,converted:0}}}}class O{static get(e,t){try{const s=localStorage.getItem(e);return s?JSON.parse(s):t}catch(s){return console.error(`Error getting ${e} from localStorage:`,s),t}}static set(e,t){try{localStorage.setItem(e,JSON.stringify(t))}catch(s){console.error(`Error setting ${e} in localStorage:`,s)}}static remove(e){try{localStorage.removeItem(e)}catch(t){console.error(`Error removing ${e} from localStorage:`,t)}}static clear(){try{localStorage.clear()}catch(e){console.error("Error clearing localStorage:",e)}}}class Ue{constructor(){d(this,"CONVERSATION_TTL",720*60*60*1e3);d(this,"CONTEXT_TTL",1440*60*1e3)}async saveConversation(e,t){const s=`conversation:${e.id}`;await w.set(s,e,this.CONVERSATION_TTL,"conversation",t)}async loadConversation(e){const t=`conversation:${e}`;return await w.get(t)}async saveChatContext(e,t){await w.setChatContext(e,t)}async loadChatContext(e){return await w.getChatContext(e)}async saveUserMemory(e,t){await w.setUserMemory(e,t)}async loadUserMemory(e){return await w.getUserMemory(e)}async saveConversationSummary(e,t){const s=`conversation_summary:${e}`;await w.set(s,t,this.CONTEXT_TTL)}async loadConversationSummary(e){const t=`conversation_summary:${e}`;return await w.get(t)}async saveGameContext(e,t,s){await w.setGameContext(e,t,s)}async loadGameContext(e,t){return await w.getGameContext(e,t)}async getUserConversations(e){return[]}async clearUserChatData(e){await w.clearUserCache(e)}}const mt=new Ue,gt=i=>{const e=new Map,t=/\[OTAKON_([A-Z_]+):\s*(.*?)\]/g;let s=i,r;for(;(r=t.exec(i))!==null;){const a=r[1];let n=r[2].trim();try{n.startsWith("{")&&n.endsWith("}")&&(n=JSON.parse(n)),n.startsWith("[")&&n.endsWith("]")&&(n=JSON.parse(n.replace(/'/g,'"')))}catch{}e.set(a,n),s=s.replace(r[0],"")}return s=s.replace(/^Hint:\s*\n\s*Hint:\s*/gm,"Hint: ").replace(/^Hint:\s*\n\s*Hint:\s*/gm,"Hint: ").replace(/\s*\]\s*$/,"").replace(/\s*\[\s*$/,"").replace(/^\s*\]\s*/,"").replace(/^\s*\[\s*/,"").replace(/\*\*\s+([^*]+?)\s+\*\*/g,"**$1**").replace(/\*\*\s+([^*]+?):/g,"**$1:**").replace(/\*\*Hint:\*\*\s*/gi,`**Hint:**
`).replace(/\*\*Lore:\*\*\s*/gi,`

**Lore:**
`).replace(/\*\*Places of Interest:\*\*\s*/gi,`

**Places of Interest:**
`).replace(/\*\*Strategy:\*\*\s*/gi,`

**Strategy:**
`).replace(/\*\*What to focus on:\*\*\s*/gi,`

**What to focus on:**
`).replace(/^Hint:\s*/i,`**Hint:**
`).replace(/\nHint:\s*/gi,`

**Hint:**
`).replace(/\nLore:\s*/gi,`

**Lore:**
`).replace(/\nPlaces of Interest:\s*/gi,`

**Places of Interest:**
`).replace(/\nStrategy:\s*/gi,`

**Strategy:**
`).replace(/\nWhat to focus on:\s*/gi,`

**What to focus on:**
`).replace(/\n{3,}/g,`

`).replace(/^\s+|\s+$/g,"").trim(),{cleanContent:s,tags:e}},P=class P{static getInstance(){return P.instance||(P.instance=new P),P.instance}generateCacheKey(e,t){var n;const s={prompt:e.trim().toLowerCase(),gameTitle:(n=t.gameTitle)==null?void 0:n.toLowerCase(),mode:t.mode},r=JSON.stringify(s);let a=0;for(let c=0;c<r.length;c++){const o=r.charCodeAt(c);a=(a<<5)-a+o,a=a&a}return Math.abs(a).toString(36)}async getCachedResponse(e){try{const{data:t,error:s}=await l.from("ai_responses").select("response_data, created_at, model_used, tokens_used, cache_type").eq("cache_key",e).gt("expires_at",new Date().toISOString()).single();if(s)return s.code==="PGRST116"?(console.log("❌ [aiCacheService] Cache MISS:",e.substring(0,8)),null):(console.error("❌ [aiCacheService] Error checking cache:",s),null);if(t){const r=t.created_at?Math.floor((Date.now()-new Date(t.created_at).getTime())/1e3/60):0;return console.log("✅ [aiCacheService] Cache HIT:",e.substring(0,8),{age:`${r}m`,model:t.model_used,tokens:t.tokens_used,type:t.cache_type}),t.response_data}return null}catch(t){return console.error("Error in getCachedResponse:",t),null}}async cacheResponse(e,t,s){try{const r=new Date;r.setHours(r.getHours()+s.ttlHours);const{data:{user:a}}=await l.auth.getUser(),{error:n}=await l.from("ai_responses").upsert({cache_key:e,response_data:JSON.parse(JSON.stringify(t)),game_title:s.gameTitle,cache_type:s.cacheType,conversation_id:s.conversationId,model_used:s.modelUsed,tokens_used:s.tokensUsed,user_id:a==null?void 0:a.id,expires_at:r.toISOString(),created_at:new Date().toISOString()},{onConflict:"cache_key"});return n?(console.error("Error caching response:",n),!1):(console.log("💾 Cached response:",e.substring(0,8),{type:s.cacheType,ttl:s.ttlHours+"h",tokens:s.tokensUsed,game:s.gameTitle}),!0)}catch(r){return console.error("Error in cacheResponse:",r),!1}}determineCacheType(e){return e.gameTitle?"game_specific":e.hasUserContext||e.conversationId?"user":"global"}determineTTL(e,t){switch(e){case"global":return 168;case"game_specific":return 24;case"user":return 12;default:return 24}}shouldCache(e,t){if(console.log(`🔍 [aiCacheService] shouldCache called with prompt: "${e.substring(0,50)}..."`,t),t.noCache===!0)return!1;if(e.trim().length<10)return console.log(`❌ [aiCacheService] Not caching: prompt too short (${e.trim().length} chars)`),!1;const s=["today","now","current","latest","recent","just released"],r=e.toLowerCase();return!s.find(n=>r.includes(n))}async cleanupExpiredCache(){try{const{data:e,error:t}=await l.from("ai_responses").delete().lt("expires_at",new Date().toISOString()).select("id");return t?(console.error("Error cleaning up cache:",t),{deleted:0}):{deleted:(e==null?void 0:e.length)||0}}catch(e){return console.error("Error in cleanupExpiredCache:",e),{deleted:0}}}async getCacheStats(){try{const{data:e,error:t}=await l.from("ai_responses").select("cache_type, tokens_used").gt("expires_at",new Date().toISOString());if(t)return console.error("Error getting cache stats:",t),{totalEntries:0,byType:{},totalTokensSaved:0};const s={totalEntries:e.length,byType:{},totalTokensSaved:e.reduce((r,a)=>r+(a.tokens_used||0),0)};return e.forEach(r=>{const a=r.cache_type||"unknown";s.byType[a]=(s.byType[a]||0)+1}),s}catch(e){return console.error("Error in getCacheStats:",e),{totalEntries:0,byType:{},totalTokensSaved:0}}}async invalidateGameCache(e){try{const{error:t}=await l.from("ai_responses").delete().eq("game_title",e).eq("cache_type","game_specific");return t?(console.error("Error invalidating game cache:",t),!1):!0}catch(t){return console.error("Error in invalidateGameCache:",t),!1}}};d(P,"instance");let ee=P;const pt=ee.getInstance(),k=class k{constructor(){}static getInstance(){return k.instance||(k.instance=new k),k.instance}generateProfileSpecificTabs(e,t){const s=[];return e.playerFocus==="Story-Driven"&&s.push({id:"narrative_themes",title:"Narrative Themes",type:"story",priority:"high",isProfileSpecific:!0,instruction:this.getNarrativeThemesInstruction(e.hintStyle)}),e.playerFocus==="Completionist"&&s.push({id:"secret_hunting",title:"Secret Hunting",type:"tips",priority:"high",isProfileSpecific:!0,instruction:this.getSecretHuntingInstruction(e.hintStyle)}),e.playerFocus==="Strategist"&&s.push({id:"optimization_guide",title:"Optimization Guide",type:"strategies",priority:"high",isProfileSpecific:!0,instruction:this.getOptimizationInstruction(e.hintStyle)}),t!=null&&t.playthroughCount&&t.playthroughCount>1&&s.push({id:"playthrough_comparison",title:"Playthrough Comparison",type:"tips",priority:"medium",isProfileSpecific:!0,instruction:this.getPlaythroughComparisonInstruction(e)}),s}getNarrativeThemesInstruction(e){const t={Cryptic:"Provide subtle hints about story themes without revealing major plot points. Use metaphorical language and thematic connections.",Balanced:"Discuss narrative elements with moderate detail, balancing spoiler avoidance with meaningful insight into themes and character arcs.",Direct:"Explain story themes clearly while maintaining appropriate spoiler warnings. Provide direct analysis of narrative elements encountered so far."};return t[e]||t.Balanced}getSecretHuntingInstruction(e){const t={Cryptic:"Give mysterious clues about hidden content locations. Use environmental riddles and subtle hints that require exploration.",Balanced:"Provide clear directions to secrets with some exploration challenge. Balance helpfulness with maintaining the joy of discovery.",Direct:"Give precise locations and requirements for finding secrets. Include step-by-step instructions and exact coordinates when helpful."};return t[e]||t.Balanced}getOptimizationInstruction(e){const t={Cryptic:"Suggest optimization strategies through hints and examples. Let the player discover the optimal path with guidance.",Balanced:"Provide balanced optimization advice with clear explanations. Suggest effective approaches while leaving room for experimentation.",Direct:"Give specific optimization recommendations with detailed steps. Provide exact stat allocations, builds, and strategies for maximum efficiency."};return t[e]||t.Direct}getPlaythroughComparisonInstruction(e){return`Compare different playthrough approaches based on ${e.playerFocus} style and ${e.hintStyle} preferences. Highlight what's different this time and suggest new strategies to explore.`}prioritizeTabsForProfile(e,t){return e.sort((s,r)=>{if(s.isProfileSpecific&&!r.isProfileSpecific)return-1;if(!s.isProfileSpecific&&r.isProfileSpecific)return 1;const a={high:3,medium:2,low:1};return a[r.priority]-a[s.priority]})}getHintStyleModifier(e){const t={Cryptic:"Use subtle, metaphorical hints. Avoid direct answers. Make the player think and discover.",Balanced:"Provide clear guidance while leaving room for exploration. Balance helpfulness with discovery.",Direct:"Give explicit, step-by-step instructions. Be precise and comprehensive in explanations."};return t[e]||t.Balanced}getPlayerFocusModifier(e){const t={"Story-Driven":"Emphasize narrative elements, character development, and story context. Prioritize lore and thematic content.",Completionist:"Focus on collectibles, hidden items, side quests, and 100% completion strategies. Highlight missable content.",Strategist:"Prioritize optimal strategies, build optimization, and efficient progression. Focus on mechanics and systems."};return t[e]||t.Strategist}getSpoilerToleranceModifier(e){const t={Strict:"NEVER mention future events, characters, or plot points. Only discuss content up to current progress.",Moderate:"You may hint at upcoming content in vague terms, but avoid specific spoilers.",Relaxed:"You can discuss future content more freely, but still mark major spoilers clearly."};return t[e]||t.Strict}getToneModifier(e){const t={Encouraging:"Use an enthusiastic, supportive tone. Celebrate achievements and provide positive reinforcement.",Professional:"Maintain a knowledgeable, respectful tone. Provide expertise without excessive casualness.",Casual:"Use a friendly, conversational tone. Feel free to use gaming terminology and be relaxed."};return t[e]||t.Professional}buildProfileContext(e){return[`Hint Style: ${this.getHintStyleModifier(e.hintStyle)}`,`Player Focus: ${this.getPlayerFocusModifier(e.playerFocus)}`,`Spoiler Tolerance: ${this.getSpoilerToleranceModifier(e.spoilerTolerance)}`,`Tone: ${this.getToneModifier(e.preferredTone)}`].join(`
`)}getDefaultProfile(){return{hintStyle:"Balanced",playerFocus:"Strategist",preferredTone:"Professional",spoilerTolerance:"Strict"}}};d(k,"instance");let te=k;const D=te.getInstance(),ae=`
You MUST use the following tags to structure your response. Do not put them in a code block.
- [OTAKON_GAME_ID: Game Name]: The full, official name of the game you've identified.
- [OTAKON_CONFIDENCE: high|low]: Your confidence in the game identification.
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
- [OTAKON_TRIUMPH: {"type": "boss_defeated", "name": "Boss Name"}]: When analyzing a victory screen.
- [OTAKON_OBJECTIVE_SET: {"description": "New objective"}]: When a new player objective is identified.
- [OTAKON_INSIGHT_UPDATE: {"id": "sub_tab_id", "content": "content"}]: To update a specific sub-tab.
- [OTAKON_INSIGHT_MODIFY_PENDING: {"id": "sub_tab_id", "title": "New Title", "content": "New content"}]: When user asks to modify a subtab via @command.
- [OTAKON_INSIGHT_DELETE_REQUEST: {"id": "sub_tab_id"}]: When user asks to delete a subtab via @command.
- [OTAKON_SUGGESTIONS: ["suggestion1", "suggestion2", "suggestion3"]]: Three contextual follow-up prompts for the user. Make these short, specific questions that help the user learn more about the current situation, get tips, or understand what to do next.
`,Ge=`
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
`,$e=i=>`
**Persona: General Gaming Assistant**
You are Otagon, a helpful and knowledgeable AI gaming assistant for the "Game Hub" tab.

**CRITICAL: Use Real Information**
- Today's date is ${new Date().toLocaleDateString("en-US",{month:"long",day:"numeric",year:"numeric"})}
- You have access to Google Search grounding for current information
- ALWAYS cite specific game titles, release dates, and accurate details from web search results
- NEVER use placeholders like "[Hypothetical Game A]" or "[Insert Today's Date]"
- For questions about recent releases, new updates, or announcements, use the grounded web search data
- Your knowledge cutoff is January 2025 - use web search for anything after that date
- Always provide specific, real game titles and accurate information

**Task:**
1. Thoroughly answer the user's query: "${i}".
2. If the query is about a SPECIFIC RELEASED GAME that the user mentions by name, you MUST include these tags:
   - [OTAKON_GAME_ID: Full Game Name] - The complete, official name of the game
   - [OTAKON_CONFIDENCE: high|low] - Your confidence in the identification
   - [OTAKON_GENRE: Genre] - The primary genre (e.g., Action RPG, FPS, Strategy)
   - [OTAKON_GAME_STATUS: unreleased] - ONLY if the game is NOT YET RELEASED
3. Provide three relevant suggested prompts using the [OTAKON_SUGGESTIONS] tag.

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

**IMPORTANT - When to use game tags:**
✅ User asks: "How do I beat the first boss in Elden Ring?" → Include [OTAKON_GAME_ID: Elden Ring] [OTAKON_CONFIDENCE: high] [OTAKON_GENRE: Action RPG]
✅ User asks: "What's the best build for Cyberpunk 2077?" → Include [OTAKON_GAME_ID: Cyberpunk 2077] [OTAKON_CONFIDENCE: high] [OTAKON_GENRE: Action RPG]
❌ User asks: "What's a good RPG to play?" → NO game tags (general question)
❌ User asks: "Tell me about open world games" → NO game tags (general question)

**Tag Definitions:**
${ae}

**Response Style:**
- Be helpful and knowledgeable about gaming
- Keep responses concise but informative
- Use gaming terminology appropriately
- For game-specific queries, start with "Hint:" and provide actionable advice
- Focus on useful information, not obvious descriptions
- Make responses engaging and immersive
- NEVER include underscore lines (___), horizontal rules, or timestamps at the end of responses
- End responses naturally without decorative separators
`,De=(i,e,t,s,r)=>{var h,f;const a=((h=i.subtabs)==null?void 0:h.filter(b=>b.status==="loaded"&&b.content).map(b=>`### ${b.title} (ID: ${b.id})
${b.content}`).join(`

`))||"No subtabs available yet.",n=i.messages.slice(-10).map(b=>`${b.role==="user"?"User":"Otagon"}: ${b.content}`).join(`
`),c=i.contextSummary?`**Historical Context (Previous Sessions):**
${i.contextSummary}

`:"",o=r||D.getDefaultProfile(),u=D.buildProfileContext(o);return`
**Persona: Game Companion**
You are Otagon, an immersive AI companion for the game "${i.gameTitle}".
The user's spoiler preference is: "${((f=t.preferences)==null?void 0:f.spoilerPreference)||"none"}".
The user's current session mode is: ${s?"ACTIVE (currently playing)":"PLANNING (not playing)"}.

**Web Search Grounding Available:**
- You have access to Google Search for current information about this game
- Use web search for: patch notes, updates, DLC announcements, strategy guides, wiki information
- Your knowledge cutoff is January 2025 - use grounding for recent game updates or patches
- Always cite specific sources when using grounded information

**Game Context:**
- Game: ${i.gameTitle} (${i.genre})
- Current Objective: ${i.activeObjective||"Not set"}
- Game Progress: ${i.gameProgress||0}%

**Player Profile:**
${u}

**Current Subtabs (Your Knowledge Base):**
${a}

${c}**Recent Conversation History:**
${n}

**User Query:** "${e}"

**Task:**
1. Respond to the user's query in an immersive, in-character way that matches the tone of the game.
2. Use the subtab context above to provide informed, consistent answers.
3. **IMPORTANT: Adapt your response style based on the Player Profile above.**
4. If the query provides new information, update relevant subtabs using [OTAKON_INSIGHT_UPDATE].
5. If the query implies progress, identify new objectives using [OTAKON_OBJECTIVE_SET].
6. ${s?"Provide concise, actionable advice for immediate use.":"Provide more detailed, strategic advice for planning."}
7. Generate three contextual suggested prompts using the [OTAKON_SUGGESTIONS] tag.

${Ge}

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
${ae}

**Response Style:**
- Match the tone and atmosphere of ${i.gameTitle}
- Be spoiler-free beyond current progress
- Provide practical, actionable advice
- Use game-specific terminology and references
- Start with "Hint:" for game-specific queries
- Include lore and story context appropriate to player's progress
- When updating subtabs, seamlessly integrate the update into your response
`},Me=(i,e,t,s)=>{const r=s||D.getDefaultProfile();return`
**Persona: Game Lore Expert & Screenshot Analyst**
You are Otagon, an expert at analyzing game visuals and providing immersive, lore-rich assistance.

**Player Profile:**
${D.buildProfileContext(r)}

**Task:**
1. Analyze the screenshot to identify the game
2. **CRITICAL TAG REQUIREMENTS - Include ALL of these tags:**
   - [OTAKON_GAME_ID: Full Game Name] - The complete, official name of the game
   - [OTAKON_CONFIDENCE: high|low] - Your confidence in the identification
   - [OTAKON_GENRE: Genre] - The primary genre (e.g., Action RPG, FPS, Strategy)
   - [OTAKON_IS_FULLSCREEN: true|false] - Is this fullscreen gameplay? (For informational purposes)
   - [OTAKON_GAME_STATUS: unreleased] - ONLY include this if the game is NOT YET RELEASED (verify release date!)
3. Answer: "${e}" with focus on game lore, significance, and useful context
4. Provide 3 contextual suggestions using [OTAKON_SUGGESTIONS: ["suggestion1", "suggestion2", "suggestion3"]]

**Tag Usage Examples:**
✅ Gameplay screenshot (CREATES TAB): [OTAKON_GAME_ID: Elden Ring] [OTAKON_CONFIDENCE: high] [OTAKON_GENRE: Action RPG] [OTAKON_IS_FULLSCREEN: true]
✅ In-game inventory menu (CREATES TAB): [OTAKON_GAME_ID: Elden Ring] [OTAKON_CONFIDENCE: high] [OTAKON_GENRE: Action RPG] [OTAKON_IS_FULLSCREEN: true]
✅ Main menu before starting (STAYS IN GAME HUB): [OTAKON_GAME_ID: Elden Ring] [OTAKON_CONFIDENCE: high] [OTAKON_GENRE: Action RPG] [OTAKON_IS_FULLSCREEN: false]
✅ Unreleased game: [OTAKON_GAME_ID: GTA VI] [OTAKON_CONFIDENCE: high] [OTAKON_GENRE: Action Adventure] [OTAKON_IS_FULLSCREEN: true] [OTAKON_GAME_STATUS: unreleased]

**IMPORTANT - Game Tab Creation:**
- Screenshots showing ACTIVE GAMEPLAY or IN-GAME MENUS will create a dedicated game tab
- Set [OTAKON_IS_FULLSCREEN: true] for gameplay, in-game menus, or any screen accessed DURING a play session
- Main menus, character selection, launchers should use [OTAKON_IS_FULLSCREEN: false]
- These pre-game screens will be handled in the "Game Hub" for quick questions

**What counts as fullscreen gameplay (for IS_FULLSCREEN tag = true, CREATES TAB):**
- In-game world exploration with HUD visible
- Combat encounters with player character visible
- Active gameplay with health/stamina/ammo displays
- **In-game menus: inventory, map, skill tree, quest log, crafting, loadout**
- **Character stats, equipment, loot screens accessed during gameplay**
- Pause menus DURING gameplay (game world visible or obscured)
- Cutscenes during gameplay with game UI

**What is NOT fullscreen gameplay (IS_FULLSCREEN = false, STAYS IN GAME HUB):**
- Main menus BEFORE starting game (Press Start, New Game, Continue, Load Game)
- Settings/Options menus accessed before gameplay begins
- Character creation/selection screens at game start
- Loading screens or splash screens
- Launchers (Steam, Epic, etc.) or desktop with game icon
- Store pages or promotional images
- Tutorial screens before gameplay starts

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

**Suggestions Guidelines:**
Generate 3 short, specific follow-up questions that help the user:
- Learn more about the current situation or location
- Get tactical advice for what they're seeing
- Understand story implications or character motivations
- Get tips for gameplay mechanics shown in the screenshot
- Explore related game content or areas

Examples of good suggestions:
- "What's the significance of this location?"
- "How do I handle this type of enemy?"
- "What should I do next here?"
- "Tell me about this character's backstory"
- "What items should I look for in this area?"

**Tag Definitions:**
${ae}
`},ft=(i,e,t,s,r,a)=>r?Me(i,e,t,a):!i.isGameHub&&i.gameTitle?De(i,e,t,s,a):$e(e);class Fe{constructor(){d(this,"retryAttempts",new Map);d(this,"MAX_RETRIES",3);d(this,"RETRY_DELAYS",[1e3,2e3,4e3])}async handleAIError(e,t){if(console.error(`🤖 [ErrorRecovery] AI Error in ${t.operation}:`,e),this.shouldRetry(t)){const s=this.getRetryDelay(t.retryCount);return await this.delay(s),{type:"retry",action:async()=>{}}}return e.message.includes("API key")||e.message.includes("authentication")?{type:"user_notification",message:"AI service authentication failed. Please check your API key in settings."}:e.message.includes("rate limit")||e.message.includes("quota")?{type:"user_notification",message:"AI service is temporarily busy. Please try again in a few moments."}:e.message.includes("network")||e.message.includes("timeout")?{type:"user_notification",message:"Network connection issue. Please check your internet connection and try again."}:{type:"user_notification",message:"AI service is temporarily unavailable. Please try again later."}}async handleConversationError(e,t){return console.error(`💬 [ErrorRecovery] Conversation Error in ${t.operation}:`,e),e.message.includes("not found")?{type:"fallback",message:"Conversation not found. Creating a new one.",action:async()=>{}}:e.message.includes("permission")||e.message.includes("unauthorized")?{type:"user_notification",message:"Permission denied. Please log in again."}:{type:"user_notification",message:"Failed to save conversation. Your data may not be persisted."}}async handleCacheError(e,t){return console.error(`💾 [ErrorRecovery] Cache Error in ${t.operation}:`,e),{type:"skip",message:"Cache unavailable. Continuing without caching."}}async handleWebSocketError(e,t){if(console.error(`🔌 [ErrorRecovery] WebSocket Error in ${t.operation}:`,e),this.shouldRetry(t)){const s=this.getRetryDelay(t.retryCount);return{type:"retry",action:async()=>{await this.delay(s)}}}return{type:"user_notification",message:"PC connection lost. Screenshot upload may not be available."}}shouldRetry(e){const t=`${e.operation}_${e.conversationId||"global"}`;return(this.retryAttempts.get(t)||0)<this.MAX_RETRIES}getRetryDelay(e){return this.RETRY_DELAYS[Math.min(e,this.RETRY_DELAYS.length-1)]}incrementRetryCount(e){const t=`${e.operation}_${e.conversationId||"global"}`,s=this.retryAttempts.get(t)||0;this.retryAttempts.set(t,s+1)}resetRetryCount(e){const t=`${e.operation}_${e.conversationId||"global"}`;this.retryAttempts.delete(t)}delay(e){return new Promise(t=>setTimeout(t,e))}displayError(e,t="error"){console.log(`[${t.toUpperCase()}] ${e}`),t==="error"&&console.error("User Error:",e)}logError(e,t,s){console.error("Error Details:",{error:e.message,stack:e.stack,context:t,additionalInfo:s,timestamp:new Date().toISOString()})}}const yt=new Fe;class Le{constructor(){d(this,"gameTones",{"Action RPG":{adjectives:["epic","heroic","legendary","mystical","ancient"],personality:"wise and experienced adventurer",speechPattern:"speaks with the wisdom of ages and the thrill of adventure",loreStyle:"rich with mythology and ancient secrets"},FPS:{adjectives:["intense","tactical","precise","combat-ready","strategic"],personality:"battle-hardened soldier",speechPattern:"communicates with military precision and combat experience",loreStyle:"focused on warfare, technology, and military history"},Horror:{adjectives:["ominous","chilling","mysterious","haunting","eerie"],personality:"knowledgeable survivor",speechPattern:"speaks with caution and awareness of lurking dangers",loreStyle:"dark and atmospheric, filled with supernatural elements"},Puzzle:{adjectives:["logical","methodical","analytical","clever","systematic"],personality:"brilliant problem-solver",speechPattern:"explains with clear logic and step-by-step reasoning",loreStyle:"intellectual and mysterious, focused on patterns and solutions"},RPG:{adjectives:["immersive","narrative-driven","character-focused","epic","emotional"],personality:"storyteller and guide",speechPattern:"speaks like a narrator, weaving tales and character development",loreStyle:"deep character development and rich storytelling"},Strategy:{adjectives:["tactical","strategic","calculated","methodical","commanding"],personality:"master tactician",speechPattern:"speaks with authority and strategic insight",loreStyle:"focused on warfare, politics, and grand strategy"},Adventure:{adjectives:["exploratory","curious","adventurous","discoverer","wanderer"],personality:"intrepid explorer",speechPattern:"speaks with wonder and excitement about discovery",loreStyle:"filled with exploration, discovery, and world-building"},Default:{adjectives:["helpful","knowledgeable","friendly","supportive","engaging"],personality:"helpful gaming companion",speechPattern:"speaks clearly and helpfully",loreStyle:"focused on gameplay and helpful information"}})}getGameTone(e){return this.gameTones[e]||this.gameTones.Default}generateImmersionContext(e){const t=this.getGameTone(e.genre);let s=`**Immersion Context for ${e.gameTitle}:**
`;return s+=`You are speaking as a ${t.personality} who ${t.speechPattern}.
`,s+=`The game's lore is ${t.loreStyle}.
`,e.currentLocation&&(s+=`The player is currently in: ${e.currentLocation}
`),e.recentEvents&&e.recentEvents.length>0&&(s+=`Recent events: ${e.recentEvents.join(", ")}
`),e.playerProgress!==void 0&&(s+=`Player progress: ${e.playerProgress}%
`),s+=`
**Response Guidelines:**
`,s+=`- Use ${t.adjectives.join(", ")} language
`,s+=`- Maintain the ${t.personality} personality
`,s+=`- Focus on ${t.loreStyle} elements
`,s+=`- Keep responses immersive and in-character
`,s}enhanceResponse(e,t){let s=e;return t.genre==="Horror"?s=`*The shadows seem to whisper as you approach...*

${e}`:t.genre==="Action RPG"?s=`*The ancient knowledge flows through your mind...*

${e}`:t.genre==="FPS"?s=`*Mission briefing updated...*

${e}`:t.genre==="Puzzle"&&(s=`*The solution becomes clearer...*

${e}`),s}getGenreSuggestions(e,t){const s=["Tell me more about this area","What should I do next?","Any tips for this situation?"];return{"Action RPG":["What's the lore behind this location?","How do I improve my character?","What quests are available here?","Tell me about the local NPCs"],FPS:["What's the best tactical approach?","What weapons work best here?","How do I flank the enemy?","What's the mission objective?"],Horror:["What's the history of this place?","How do I survive this area?","What should I be careful of?","Tell me about the local legends"],Puzzle:["What's the pattern here?","How do I solve this step by step?","What clues am I missing?","What's the logical approach?"],RPG:["Tell me about the story so far","What choices should I make?","How do I develop my character?","What's the significance of this moment?"],Strategy:["What's the best strategy here?","How do I manage my resources?","What's the optimal build order?","How do I counter this threat?"]}[e]||s}createImmersiveSubTabContent(e,t,s){var a,n;const r={walkthrough:{"Action RPG":`# ${t} - Walkthrough

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
*Master the game...*`}};return((a=r[e])==null?void 0:a[s])||((n=r[e])==null?void 0:n.Default)||`# ${t} - ${e}

*Content loading...*`}}const bt=new Le;class We{constructor(){d(this,"STORAGE_KEY","otakon_used_suggested_prompts");d(this,"LAST_RESET_KEY","otakon_suggested_prompts_last_reset");d(this,"RESET_INTERVAL_MS",1440*60*1e3);d(this,"usedPrompts",new Set);this.loadUsedPrompts(),this.checkAndResetIfNeeded()}loadUsedPrompts(){try{const e=localStorage.getItem(this.STORAGE_KEY);if(e){const t=JSON.parse(e);this.usedPrompts=new Set(t)}}catch{this.usedPrompts=new Set}}saveUsedPrompts(){try{const e=Array.from(this.usedPrompts);localStorage.setItem(this.STORAGE_KEY,JSON.stringify(e))}catch{}}checkAndResetIfNeeded(){try{const e=localStorage.getItem(this.LAST_RESET_KEY),t=Date.now();(!e||t-parseInt(e)>=this.RESET_INTERVAL_MS)&&(this.resetUsedPrompts(),localStorage.setItem(this.LAST_RESET_KEY,t.toString()))}catch{}}markPromptAsUsed(e){this.usedPrompts.add(e),this.saveUsedPrompts()}isPromptUsed(e){return this.usedPrompts.has(e)}getUnusedPrompts(e){return e.filter(t=>!this.isPromptUsed(t))}areAllPromptsUsed(e){return e.every(t=>this.isPromptUsed(t))}resetUsedPrompts(){this.usedPrompts.clear(),localStorage.removeItem(this.STORAGE_KEY)}getUsedCount(){return this.usedPrompts.size}getTimeUntilNextReset(){try{const e=localStorage.getItem(this.LAST_RESET_KEY);if(!e)return 0;const t=parseInt(e)+this.RESET_INTERVAL_MS;return Math.max(0,t-Date.now())}catch{return 0}}getStaticNewsPrompts(){return Te}processAISuggestions(e){if(!e)return[];let t=[];if(Array.isArray(e))t=e;else if(typeof e=="string"){let r=e.trim();r.startsWith('["')&&!r.endsWith('"]')&&(r.endsWith('"')||(r+='"'),r.endsWith("]")||(r+="]"));try{const a=JSON.parse(r);Array.isArray(a)?t=a:t=[e]}catch{r.includes('", "')||r.includes(`",
"`)?t=r.split(/",\s*"/).map(n=>n.replace(/^["\s]+|["\s]+$/g,"")).filter(n=>n.length>0):r.includes(`
`)?t=r.split(`
`).map(n=>n.replace(/^["\s]+|["\s]+$/g,"")).filter(n=>n.length>0):t=[e]}}return t.filter(r=>r&&typeof r=="string"&&r.trim().length>0).map(r=>r.trim()).slice(0,3)}getFallbackSuggestions(e,t){return t===!0||e==="game-hub"||e==="everything-else"?this.getStaticNewsPrompts():["What should I do next in this area?","Tell me about the story so far","Give me some tips for this game","What are the key mechanics I should know?"]}}const St=new We;class He{async generatePlayingSessionSummary(e){const t=e.messages.filter(n=>n.role==="assistant"&&n.content.includes("Hint:")),s=this.extractKeyPoints(t),r=this.extractObjectives(t),a=`Playing session summary for ${e.gameTitle}:
    
Key Achievements:
${s.map(n=>`• ${n}`).join(`
`)}

Current Objectives:
${r.map(n=>`• ${n}`).join(`
`)}

Recent Progress:
${t.slice(-3).map(n=>`- ${n.content.substring(0,100)}...`).join(`
`)}`;return{mode:"playing",gameTitle:e.gameTitle||"Unknown Game",conversationId:e.id,summary:a,keyPoints:s,objectives:r,timestamp:Date.now()}}async generatePlanningSessionSummary(e){const t=e.messages.filter(n=>n.role==="assistant"&&!n.content.includes("Hint:")),s=this.extractKeyPoints(t),r=this.extractObjectives(t),a=`Planning session summary for ${e.gameTitle}:
    
Planned Strategies:
${s.map(n=>`• ${n}`).join(`
`)}

Goals to Achieve:
${r.map(n=>`• ${n}`).join(`
`)}

Strategic Notes:
${t.slice(-3).map(n=>`- ${n.content.substring(0,100)}...`).join(`
`)}`;return{mode:"planning",gameTitle:e.gameTitle||"Unknown Game",conversationId:e.id,summary:a,keyPoints:s,objectives:r,timestamp:Date.now()}}extractKeyPoints(e){const t=[];return e.forEach(s=>{(s.content.includes("defeated")||s.content.includes("completed"))&&t.push("Achievement unlocked or objective completed"),(s.content.includes("found")||s.content.includes("discovered"))&&t.push("New item or location discovered"),(s.content.includes("unlocked")||s.content.includes("gained"))&&t.push("New ability or feature unlocked")}),t.length>0?t:["Session progress recorded"]}extractObjectives(e){const t=[];return e.forEach(s=>{(s.content.includes("objective")||s.content.includes("goal"))&&t.push("Continue current objective"),(s.content.includes("next")||s.content.includes("should"))&&t.push("Follow recommended next steps"),(s.content.includes("explore")||s.content.includes("investigate"))&&t.push("Explore new areas or investigate leads")}),t.length>0?t:["Continue game progression"]}async storeSessionSummary(e,t){}async getLatestSessionSummary(e){return null}}const wt=new He,x=class x{static getInstance(){return x.instance||(x.instance=new x),x.instance}async getSubtabs(e){return this.getSubtabsFromTable(e)}async setSubtabs(e,t){{console.error(`🔄 [SubtabsService] Writing ${t.length} subtabs to BOTH table AND JSONB for conversation:`,e);const s=await this.setSubtabsInTable(e,t);console.error("  ✅ Table write:",s?"SUCCESS":"FAILED");const r=await this.setSubtabsInJsonb(e,t);return console.error("  ✅ JSONB write:",r?"SUCCESS":"FAILED"),s&&r}}async addSubtab(e,t){const{data:s,error:r}=await l.from("conversations").select("is_unreleased, title").eq("id",e).single();if(r)return console.error("Error checking conversation for unreleased status:",r),null;if(s!=null&&s.is_unreleased)throw new Error("Subtabs cannot be created for unreleased games. This feature will be available once the game is released.");{const a=await this.addSubtabToTable(e,t);return await this.addSubtabToJsonb(e,t),a}}async updateSubtab(e,t,s){{const r=await this.updateSubtabInTable(t,s),a=await this.updateSubtabInJsonb(e,t,s);return r&&a}}async deleteSubtab(e,t){return this.deleteSubtabFromTable(t)}async getSubtabsFromTable(e){try{const{data:t,error:s}=await l.from("subtabs").select("*").eq("conversation_id",e).order("order_index",{ascending:!0});return s?(console.error("Error getting subtabs from table:",s),[]):(t||[]).map(r=>{const a=typeof r.metadata=="object"&&r.metadata!==null?r.metadata:{};return{id:r.id,title:r.title,content:r.content||"",type:r.tab_type,isNew:a.isNew||!1,status:a.status||"loaded",instruction:a.instruction}})}catch(t){return console.error("Error getting subtabs from table:",t),[]}}async setSubtabsInTable(e,t){try{const{error:s}=await l.from("subtabs").delete().eq("conversation_id",e);if(s)return console.error("Error deleting existing subtabs:",s),!1;if(t.length>0){const r=t.map((n,c)=>({id:n.id,conversation_id:e,game_id:null,title:n.title,content:n.content,tab_type:n.type,order_index:c,metadata:{isNew:n.isNew,status:n.status,instruction:n.instruction}})),{error:a}=await l.from("subtabs").insert(r);if(a)return console.error("Error inserting subtabs:",a),!1}return!0}catch(s){return console.error("Error setting subtabs in table:",s),!1}}async addSubtabToTable(e,t){var s;try{const{data:r}=await l.from("conversations").select("game_id").eq("id",e).single(),a=(r==null?void 0:r.game_id)||"",{data:n}=await l.from("subtabs").select("order_index").eq("conversation_id",e).order("order_index",{ascending:!1}).limit(1),c=((s=n==null?void 0:n[0])==null?void 0:s.order_index)??-1,{data:o,error:u}=await l.from("subtabs").insert({id:t.id,conversation_id:e,game_id:a,title:t.title,content:t.content,tab_type:t.type,order_index:c+1,metadata:{isNew:t.isNew,status:t.status,instruction:t.instruction}}).select().single();return u?(console.error("Error adding subtab to table:",u),null):{id:o.id,title:o.title,content:Ee(o.content),type:o.tab_type,isNew:typeof o.metadata=="object"&&o.metadata!==null&&!Array.isArray(o.metadata)&&o.metadata.isNew||!1,status:(typeof o.metadata=="object"&&o.metadata!==null&&!Array.isArray(o.metadata)?o.metadata.status:void 0)||"loaded",instruction:typeof o.metadata=="object"&&o.metadata!==null&&!Array.isArray(o.metadata)?o.metadata.instruction:void 0}}catch(r){return console.error("Error adding subtab to table:",r),null}}async updateSubtabInTable(e,t){try{const s={};if(t.title!==void 0&&(s.title=t.title),t.content!==void 0&&(s.content=t.content),t.type!==void 0&&(s.tab_type=t.type),t.isNew!==void 0||t.status!==void 0||t.instruction!==void 0){const{data:a}=await l.from("subtabs").select("metadata").eq("id",e).single(),n=typeof(a==null?void 0:a.metadata)=="object"&&(a==null?void 0:a.metadata)!==null?a.metadata:{};s.metadata={...n,...t.isNew!==void 0&&{isNew:t.isNew},...t.status!==void 0&&{status:t.status},...t.instruction!==void 0&&{instruction:t.instruction}}}const{error:r}=await l.from("subtabs").update(s).eq("id",e);return r?(console.error("Error updating subtab in table:",r),!1):!0}catch(s){return console.error("Error updating subtab in table:",s),!1}}async deleteSubtabFromTable(e){try{const{error:t}=await l.from("subtabs").delete().eq("id",e);return t?(console.error("Error deleting subtab from table:",t),!1):!0}catch(t){return console.error("Error deleting subtab from table:",t),!1}}async getSubtabsFromJsonb(e){try{const{data:t,error:s}=await l.from("conversations").select("subtabs").eq("id",e).single();return s?(console.error("Error getting subtabs from JSONB:",s),[]):(t==null?void 0:t.subtabs)||[]}catch(t){return console.error("Error getting subtabs from JSONB:",t),[]}}async setSubtabsInJsonb(e,t){try{const{error:s}=await l.from("conversations").update({subtabs:t,subtabs_order:t.map(r=>r.id)}).eq("id",e);return s?(console.error("Error setting subtabs in JSONB:",s),!1):!0}catch(s){return console.error("Error setting subtabs in JSONB:",s),!1}}async addSubtabToJsonb(e,t){try{const r=[...await this.getSubtabsFromJsonb(e),t];return await this.setSubtabsInJsonb(e,r)?t:null}catch(s){return console.error("Error adding subtab to JSONB:",s),null}}async updateSubtabInJsonb(e,t,s){try{const a=(await this.getSubtabsFromJsonb(e)).map(n=>n.id===t?{...n,...s}:n);return await this.setSubtabsInJsonb(e,a)}catch(r){return console.error("Error updating subtab in JSONB:",r),!1}}async deleteSubtabFromJsonb(e,t){try{const r=(await this.getSubtabsFromJsonb(e)).filter(a=>a.id!==t);return await this.setSubtabsInJsonb(e,r)}catch(s){return console.error("Error deleting subtab from JSONB:",s),!1}}async migrateConversationSubtabs(e){try{const t=await this.getSubtabsFromJsonb(e);return t.length===0?!0:await this.setSubtabsInTable(e,t)}catch(t){return console.error("Error migrating subtabs:",t),!1}}async rollbackConversationSubtabs(e){try{const t=await this.getSubtabsFromTable(e);return t.length===0?!0:await this.setSubtabsInJsonb(e,t)}catch(t){return console.error("Error rolling back subtabs:",t),!1}}async migrateAllSubtabs(){try{const{data:e,error:t}=await l.from("conversations").select("id, subtabs").not("subtabs","is",null);if(t)return console.error("Error fetching conversations:",t),{success:0,failed:0};let s=0,r=0;const a=(e||[]).filter(c=>c.subtabs&&Array.isArray(c.subtabs)&&c.subtabs.length>0).map(c=>this.migrateConversationSubtabs(c.id));return(await Promise.allSettled(a)).forEach(c=>{c.status==="fulfilled"&&c.value?s++:r++}),{success:s,failed:r}}catch(e){return console.error("Error in batch migration:",e),{success:0,failed:0}}}};d(x,"instance");let se=x;const B=se.getInstance();function Y(){var i;return((i=globalThis.crypto)==null?void 0:i.randomUUID())||"xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g,e=>{const t=Math.random()*16|0;return(e==="x"?t:t&3|8).toString(16)})}class qe{async createGameTab(e){var a,n,c;const t=await y.getConversation(e.conversationId);if(t){if(e.aiResponse&&((a=t.subtabs)!=null&&a.some(o=>o.status==="loading"||o.content==="Loading..."))){const o=this.extractInsightsFromAIResponse(e.aiResponse,t.subtabs);return await y.updateConversation(t.id,{subtabs:o,updatedAt:Date.now()}),{...t,subtabs:o}}return t}let s=[];if(e.isUnreleased)console.error("🎮 [GameTabService] Creating unreleased game tab (no subtabs, Discuss mode only)");else if(e.aiResponse)if(console.error("🎮 [GameTabService] Extracting subtabs from AI response"),(n=e.aiResponse.gamePillData)!=null&&n.wikiContent&&Object.keys(e.aiResponse.gamePillData.wikiContent).length>0)console.error("🎮 [GameTabService] Found gamePillData.wikiContent with",Object.keys(e.aiResponse.gamePillData.wikiContent).length,"tabs"),s=Object.entries(e.aiResponse.gamePillData.wikiContent).map(([o,u])=>({id:Y(),title:this.formatTabTitle(o),type:this.determineTabType(o),content:u,isNew:!1,status:"loaded"})),console.error("🎮 [GameTabService] Created",s.length,"subtabs from gamePillData.wikiContent");else if(e.aiResponse.progressiveInsightUpdates&&e.aiResponse.progressiveInsightUpdates.length>0)console.error("🎮 [GameTabService] Found progressiveInsightUpdates with",e.aiResponse.progressiveInsightUpdates.length,"updates"),s=e.aiResponse.progressiveInsightUpdates.map(o=>({id:Y(),title:o.title,type:this.determineTabType(o.tabId),content:o.content,isNew:!1,status:"loaded"})),console.error("🎮 [GameTabService] Created",s.length,"subtabs from progressiveInsightUpdates");else{const o=this.extractInsightsFromAIResponse(e.aiResponse,[]);o.length>0?(s=o,console.error("🎮 [GameTabService] Created",s.length,"subtabs from INSIGHT_UPDATE tags")):(s=this.generateInitialSubTabs(e.genre||"Default",e.playerProfile),console.error("🎮 [GameTabService] Created",s.length,"template subtabs (will populate via background AI using conversation context)"))}else s=this.generateInitialSubTabs(e.genre||"Default",e.playerProfile),console.error("🎮 [GameTabService] Created",s.length,"initial template subtabs (no AI response)");const r={id:e.conversationId,title:e.gameTitle,messages:[],createdAt:Date.now(),updatedAt:Date.now(),isActive:!1,gameId:e.gameTitle.toLowerCase().replace(/\s+/g,"-"),gameTitle:e.gameTitle,genre:e.genre,subtabs:s,subtabsOrder:s.map(o=>o.id),isActiveSession:!1,activeObjective:"",gameProgress:0,isUnreleased:e.isUnreleased||!1};return await y.addConversation(r),s.length>0?(console.error("🎮 [GameTabService] Saving",s.length,"subtabs for conversation:",r.id),console.error("🎮 [GameTabService] Subtabs:",JSON.stringify(s,null,2)),await B.setSubtabs(r.id,s)):console.error("🎮 [GameTabService] No subtabs to save for conversation:",r.id),e.aiResponse?(c=r.subtabs)!=null&&c.some(u=>u.content==="Loading...")&&this.generateInitialInsights(r,e.playerProfile,e.aiResponse).catch(u=>console.error("Background insight generation failed:",u)):this.generateInitialInsights(r,e.playerProfile,e.aiResponse).catch(o=>console.error("Background insight generation failed:",o)),r}generateInitialSubTabs(e,t,s){let a=(ce[e]||ce.Default).map(n=>({...n,priority:"medium",isProfileSpecific:!1}));if(t){console.error("🎮 [GameTabService] Generating profile-specific tabs for:",t.playerFocus);const n=D.generateProfileSpecificTabs(t,s);a=[...a,...n],a=D.prioritizeTabsForProfile(a,t)}return a.map(n=>({id:Y(),title:n.title,type:n.type,content:"Loading...",isNew:!0,status:"loading",instruction:n.instruction}))}extractInsightsFromAIResponse(e,t){console.error("🤖 [GameTabService] Extracting dynamic insights from AI response");const s=e.otakonTags.get("INSIGHT_UPDATE");if(s){if(console.error("🤖 [GameTabService] Found INSIGHT_UPDATE:",s),t.find(a=>a.id===s.id))return t.map(a=>a.id===s.id?{...a,content:s.content,isNew:!0,status:"loaded"}:a);{const a={id:Y(),title:this.formatTabTitle(s.id),type:this.determineTabType(s.id),content:s.content,isNew:!0,status:"loaded"};return[...t,a]}}return t}formatTabTitle(e){return e.split("_").map(t=>t.charAt(0).toUpperCase()+t.slice(1)).join(" ")}determineTabType(e){return e.includes("story")?"story":e.includes("character")?"characters":e.includes("strategy")||e.includes("tips")?"tips":e.includes("boss")?"strategies":e.includes("quest")||e.includes("walkthrough")?"walkthrough":e.includes("item")?"items":"chat"}async generateInitialInsights(e,t,s){var n,c,o;const r=e.id,a=e.gameTitle;console.error(`🤖 [GameTabService] 🔄 [${r}] Generating initial insights for: ${a}`);try{if(!(await y.getConversations(!0))[r]){console.error(`🤖 [GameTabService] [${r}] ⚠️ Conversation no longer exists, aborting insight generation`);return}let h="";s!=null&&s.content?(h=`AI Analysis: ${s.content}`,console.error(`🤖 [GameTabService] [${r}] Using AI response as context (${s.content.length} chars)`)):e.messages.length>0?(h=e.messages.map(g=>`${g.role==="user"?"User":"AI"}: ${g.content}`).join(`

`),console.error(`🤖 [GameTabService] [${r}] Using messages as context (${e.messages.length} msgs)`)):console.error(`🤖 [GameTabService] [${r}] ⚠️ No context available`),console.error(`🤖 [GameTabService] [${r}] 🚀 Calling AI generateInitialInsights...`);const f=await he.generateInitialInsights(a||"Unknown Game",e.genre||"Action RPG",t,h);if(console.error(`🤖 [GameTabService] [${r}] 📥 AI returned:`,Object.keys(f).length,"insights"),!(await y.getConversations(!0))[r]){console.error(`🤖 [GameTabService] [${r}] ⚠️ Conversation deleted during AI call, discarding results`);return}const U=f&&Object.keys(f).length>0;U?console.error(`🤖 [GameTabService] [${r}] ✅ Got ${Object.keys(f).length} insights:`,Object.keys(f)):console.error(`🤖 [GameTabService] [${r}] ❌ Empty insights, using fallback`);const ie=(await y.getConversations(!0))[r];if(!ie){console.error(`🤖 [GameTabService] [${r}] ⚠️ Conversation not found, may have been deleted`);return}const be={story:"story_so_far",walkthrough:"quest_log",strategies:"build_optimization",tips:"hidden_paths"};console.error("🤖 [GameTabService] Building content mapping for subtabs...");const X=((n=ie.subtabs)==null?void 0:n.map(g=>{let S="";const K=be[g.type];if(g.type==="strategies"&&g.title.includes("Boss")){const C="boss_strategy";U&&f[C]&&(S=f[C],console.error(`🤖 [GameTabService] Subtab "${g.title}" using AI content from key "${C}" (${S.length} chars)`))}if(!S&&U&&K&&f[K]&&(S=f[K],console.error(`🤖 [GameTabService] Subtab "${g.title}" using AI content from key "${K}" (${S.length} chars)`)),!S){let C=h;if(g.type==="story"&&h.includes("Lore:")){const E=h.match(/Lore:(.*?)(?=\n\n|\n[A-Z]|$)/s);C=E?E[1].trim():h}else if(g.type==="strategies"&&h.includes("Analysis:")){const E=h.match(/Analysis:(.*?)(?=\n\n|\n[A-Z]|$)/s);C=E?E[1].trim():h}else if(g.type==="tips"&&h.includes("Hint:")){const E=h.match(/Hint:(.*?)(?=\n\n|\n[A-Z]|$)/s);C=E?E[1].trim():h}S=`## ${g.title}

${C}`,console.error(`🤖 [GameTabService] Subtab "${g.title}" using fallback content from AI response (${S.length} chars)`),console.error("🤖 [GameTabService] Preview:",S.substring(0,150)+"...")}return{...g,content:S,isNew:!1,status:"loaded"}}))||[];console.error("🤖 [GameTabService] Updating subtabs with content...");const Se=X.map(g=>{var S;return{id:g.id,title:g.title,status:g.status,contentLength:((S=g.content)==null?void 0:S.length)||0,isNew:g.isNew}});console.error("🤖 [GameTabService] Subtabs to save:",Se),console.error("🤖 [GameTabService] ALL statuses:",X.map(g=>g.status)),console.error("🤖 [GameTabService] 🗑️ Clearing cache BEFORE subtabs write..."),y.clearCache(),await B.setSubtabs(e.id,X),console.error("🤖 [GameTabService] ✅ Subtabs dual-write complete (table + JSONB)"),y.clearCache(),await new Promise(g=>setTimeout(g,500));const oe=(await y.getConversations(!0))[e.id];oe?console.error("🤖 [GameTabService] 🔍 VERIFICATION: Read back subtabs after write:",((c=oe.subtabs)==null?void 0:c.map(g=>({title:g.title,status:g.status})))||"NO SUBTABS"):console.error("🤖 [GameTabService] ⚠️ VERIFICATION: Could not find conversation after write!"),await y.updateConversation(e.id,{updatedAt:Date.now()}),console.error("🤖 [GameTabService] ✅ Conversation metadata updated")}catch(u){console.error("🤖 [GameTabService] ❌ Failed to generate initial insights:",u),$.warning("Failed to load game insights. You can still chat about the game!");try{const f=(await y.getConversations(!0))[e.id];if(!f){console.error("🤖 [GameTabService] Conversation not found for error update:",e.id);return}const b=((o=f.subtabs)==null?void 0:o.map(U=>({...U,content:`Failed to load ${U.title} content. Please try again later.`,isNew:!1,status:"error"})))||[];await B.setSubtabs(e.id,b),await y.updateConversation(e.id,{updatedAt:Date.now()})}catch(h){console.error("🤖 [GameTabService] Failed to update error state:",h)}}}async updateSubTabContent(e,t,s){console.error("📝 [GameTabService] Updating sub-tab content:",{conversationId:e,subTabId:t});try{const a=(await y.getConversations())[e];if(!a||!a.subtabs)throw new Error("Conversation or sub-tabs not found");const n=a.subtabs.map(c=>c.id===t?{...c,content:s,isNew:!1,status:"loaded"}:c);await B.setSubtabs(e,n),await y.updateConversation(e,{updatedAt:Date.now()})}catch(r){throw console.error("Failed to update sub-tab content:",r),r}}async getGameTab(e){try{const s=(await y.getConversations())[e];return!s||!s.gameTitle?null:{id:s.id,title:s.title,gameId:s.gameId||s.gameTitle.toLowerCase().replace(/\s+/g,"-"),gameTitle:s.gameTitle,genre:s.genre||"Unknown",subtabs:s.subtabs||[],createdAt:s.createdAt,updatedAt:s.updatedAt,isActiveSession:s.isActiveSession||!1}}catch(t){return console.error("Failed to get game tab:",t),$.error("Failed to load game tab."),null}}isGameTab(e){return!e.isGameHub&&!!e.gameTitle}generateGameConversationId(e){return`game-${e.toLowerCase().replace(/[^a-z0-9\s-]/g,"").replace(/\s+/g,"-")}`}async updateSubTabsFromAIResponse(e,t){console.error(`📝 [GameTabService] [${e}] Updating subtabs from AI response:`,t.length);try{const r=(await y.getConversations(!0))[e];if(!r||!r.subtabs){console.error(`📝 [GameTabService] [${e}] ⚠️ Conversation or subtabs not found, aborting update`);return}let a=0;const n=r.subtabs.map(c=>{const o=t.find(u=>u.tabId===c.id);if(o){a++,console.error(`📝 [GameTabService] [${e}] Updating subtab: ${c.id} - ${o.title}`);const h=`

---
**Updated: `+new Date().toLocaleString()+`**

`,b=c.content&&c.content.trim().length>0&&c.content!=="Loading..."&&c.status==="loaded"?c.content+h+o.content:o.content;return{...c,title:o.title||c.title,content:b,isNew:!0,status:"loaded"}}return c});if(a===0){console.error(`📝 [GameTabService] [${e}] ⚠️ No subtabs matched for update`);return}await y.updateConversation(e,{subtabs:n,updatedAt:Date.now()}),console.error(`📝 [GameTabService] [${e}] ✅ Updated ${a} subtabs successfully`)}catch(s){throw console.error(`📝 [GameTabService] [${e}] ❌ Failed to update subtabs:`,s),s}}}const vt=new qe;class Tt{static getCurrentUser(){return O.get(I.USER,null)}static setCurrentUser(e){O.set(I.USER,e)}static createUser(e,t=Ce.FREE){const s=Date.now(),r=le[t];return{id:`user_${s}`,authUserId:`user_${s}`,email:e,tier:t,hasProfileSetup:!1,hasSeenSplashScreens:!1,hasSeenHowToUse:!1,hasSeenFeaturesConnected:!1,hasSeenProFeatures:!1,pcConnected:!1,pcConnectionSkipped:!1,onboardingCompleted:!1,hasWelcomeMessage:!1,isNewUser:!0,hasUsedTrial:!1,lastActivity:s,preferences:{},textCount:0,imageCount:0,textLimit:r.text,imageLimit:r.image,totalRequests:0,lastReset:s,usage:{textCount:0,imageCount:0,textLimit:r.text,imageLimit:r.image,totalRequests:0,lastReset:s,tier:t},appState:{},profileData:{},onboardingData:{},behaviorData:{},feedbackData:{},usageData:{},createdAt:s,updatedAt:s}}static updateUser(e){const t=this.getCurrentUser();if(!t)return;const s={...t,...e,updatedAt:Date.now()};this.setCurrentUser(s)}static updateUsage(e){const t=this.getCurrentUser();t&&this.updateUser({usage:{...t.usage,...e}})}static resetUsage(){const e=this.getCurrentUser();if(!e)return;const t=le[e.tier];this.updateUsage({textCount:0,imageCount:0,totalRequests:0,lastReset:Date.now(),textLimit:t.text,imageLimit:t.image})}static canMakeRequest(e){const t=this.getCurrentUser();if(!t)return!1;const{usage:s}=t;return e==="text"?s.textCount<s.textLimit:s.imageCount<s.imageLimit}static incrementUsage(e){const t=this.getCurrentUser();if(!t)return;const s={totalRequests:t.usage.totalRequests+1};e==="text"?s.textCount=t.usage.textCount+1:s.imageCount=t.usage.imageCount+1,this.updateUsage(s)}static logout(){O.remove(I.USER)}static async getCurrentUserAsync(){try{const e=O.get(I.USER,null),{data:{user:t},error:s}=await l.auth.getUser();if(s||!t)return e;const{data:r,error:a}=await l.from("users").select("*").eq("auth_user_id",t.id).single();if(a||!r)return console.error("Failed to fetch user from Supabase:",a),e;const n={id:r.id,authUserId:r.auth_user_id,email:r.email,tier:r.tier,textCount:r.text_count||0,imageCount:r.image_count||0,textLimit:z(r.text_limit),imageLimit:z(r.image_limit),totalRequests:r.total_requests||0,lastReset:M(r.last_reset),hasProfileSetup:r.has_profile_setup||!1,hasSeenSplashScreens:r.has_seen_splash_screens||!1,hasSeenHowToUse:r.has_seen_how_to_use||!1,hasSeenFeaturesConnected:r.has_seen_features_connected||!1,hasSeenProFeatures:r.has_seen_pro_features||!1,pcConnected:r.pc_connected||!1,pcConnectionSkipped:r.pc_connection_skipped||!1,onboardingCompleted:r.onboarding_completed||!1,hasWelcomeMessage:r.has_welcome_message||!1,isNewUser:r.is_new_user||!1,hasUsedTrial:r.has_used_trial||!1,lastActivity:M(r.updated_at),preferences:N(r.preferences),usage:{textCount:r.text_count||0,imageCount:r.image_count||0,textLimit:z(r.text_limit),imageLimit:z(r.image_limit),totalRequests:r.total_requests||0,lastReset:M(r.last_reset),tier:r.tier},appState:N(r.app_state),profileData:N(r.profile_data),onboardingData:N(r.onboarding_data),behaviorData:N(r.behavior_data),feedbackData:N(r.feedback_data),usageData:N(r.usage_data),createdAt:M(r.created_at),updatedAt:M(r.updated_at)};return O.set(I.USER,n),n}catch(e){return console.error("Error in getCurrentUserAsync:",e),O.get(I.USER,null)}}static async setCurrentUserAsync(e){try{O.set(I.USER,e);const{error:t}=await l.from("users").update({tier:e.tier,text_count:e.textCount,image_count:e.imageCount,text_limit:e.textLimit,image_limit:e.imageLimit,total_requests:e.totalRequests,last_reset:new Date(e.lastReset).toISOString(),has_profile_setup:e.hasProfileSetup,has_seen_splash_screens:e.hasSeenSplashScreens,has_seen_how_to_use:e.hasSeenHowToUse,has_seen_features_connected:e.hasSeenFeaturesConnected,has_seen_pro_features:e.hasSeenProFeatures,pc_connected:e.pcConnected,pc_connection_skipped:e.pcConnectionSkipped,onboarding_completed:e.onboardingCompleted,has_welcome_message:e.hasWelcomeMessage,has_used_trial:e.hasUsedTrial,preferences:e.preferences,profile_data:e.profileData,app_state:e.appState,onboarding_data:e.onboardingData,behavior_data:e.behaviorData,feedback_data:e.feedbackData,usage_data:e.usageData,updated_at:new Date().toISOString()}).eq("auth_user_id",e.authUserId);t&&console.error("Failed to sync user to Supabase:",t)}catch(t){console.error("Error in setCurrentUserAsync:",t)}}static async updateUsageAsync(e){const t=await this.getCurrentUserAsync();if(!t)return;const s={...t,usage:{...t.usage,...e},textCount:e.textCount??t.textCount,imageCount:e.imageCount??t.imageCount,totalRequests:e.totalRequests??t.totalRequests,lastReset:e.lastReset??t.lastReset,updatedAt:Date.now()};await this.setCurrentUserAsync(s)}}class Ke{hasTabCommand(e){return/^@\w+/.test(e.trim())}parseTabCommand(e,t){const s=e.trim();if(!this.hasTabCommand(s))return null;const r=s.match(/^@(\w+)\s*(\\modify|\\delete)?\s*(.*)$/);if(!r)return null;const[,a,n,c]=r,o=this.findMatchingTab(a,t.subtabs||[]);if(!o)return null;let u;return n==="\\delete"?u="delete":n==="\\modify"?u="modify":u="update",{type:u,tabId:o.id,tabName:o.title,instruction:c.trim()}}findMatchingTab(e,t){const s=this.normalizeTabName(e);let r=t.find(a=>this.normalizeTabName(a.id)===s||this.normalizeTabName(a.title)===s);return r||(r=t.find(a=>this.normalizeTabName(a.id).includes(s)||this.normalizeTabName(a.title).includes(s)),r)?r:(r=t.find(a=>s.includes(this.normalizeTabName(a.id))||s.includes(this.normalizeTabName(a.title))),r||null)}normalizeTabName(e){return e.toLowerCase().replace(/[_\s-]+/g,"").replace(/[^a-z0-9]/g,"")}getAvailableTabNames(e){return!e.subtabs||e.subtabs.length===0?[]:e.subtabs.map(t=>({id:t.id,title:t.title,variations:[t.id,t.title,t.id.replace(/_/g," "),t.title.toLowerCase()]})).map(t=>t.id)}formatTabSuggestion(e,t){return`@${e}`}getCommandHelp(){return`
**Tab Commands:**
• @<tab> <text> - Update tab with new info
• @<tab> \\modify <text> - Modify/rename tab
• @<tab> \\delete - Delete tab

Example: @story_so_far The player defeated the first boss
    `.trim()}validateCommand(e){switch(e.type){case"update":if(!e.instruction)return{valid:!1,error:"Update command requires content. Example: @story_so_far The player..."};break;case"modify":if(!e.instruction)return{valid:!1,error:"Modify command requires instructions. Example: @tips \\modify Change to combat strategies"};break}return{valid:!0}}describeCommand(e){switch(e.type){case"update":return`Updating "${e.tabName}" with: ${e.instruction}`;case"modify":return`Modifying "${e.tabName}": ${e.instruction}`;case"delete":return`Deleting "${e.tabName}"`}}}const Ct=new Ke;let m,G=[],ue=!1,H="",W=null,A=null,v=null,re=!1;const ze="otakonSpeechRate",ne=async()=>{try{const i=navigator;i.wakeLock&&(W=await i.wakeLock.request("screen"),W.addEventListener("release",()=>{m&&m.speaking&&!re&&ne()}))}catch{}},me=async()=>{try{W!==null&&(await W.release(),W=null)}catch{}},je=()=>{try{if(!A){const i=window;A=new(i.AudioContext||i.webkitAudioContext)}v||(v=new Audio,v.src="data:audio/wav;base64,UklGRigAAABXQVZFZm10IBIAAAABAAEARKwAAIhYAQACABAAAABkYXRhAgAAAAEA",v.loop=!0,v.volume=.01,A&&A.createMediaElementSource(v).connect(A.destination))}catch{}},ge=async()=>{try{v&&A&&(A.state==="suspended"&&await A.resume(),await v.play())}catch{}},pe=()=>{try{v&&(v.pause(),v.currentTime=0)}catch{}},Be=()=>new Promise((i,e)=>{if(!m)return e(new Error("Speech synthesis not initialized."));if(G=m.getVoices(),G.length>0){i();return}m.onvoiceschanged=()=>{G=m.getVoices(),i()},setTimeout(()=>{G.length===0&&(G=m.getVoices()),i()},1e3)}),q=()=>{m&&m.speaking&&m.cancel(),H="","mediaSession"in navigator&&navigator.mediaSession.playbackState!=="none"&&(navigator.mediaSession.playbackState="paused"),me(),pe(),window.dispatchEvent(new CustomEvent("otakon:ttsStopped"))},Ye=()=>{m&&m.speaking&&!m.paused&&(m.pause(),"mediaSession"in navigator&&(navigator.mediaSession.playbackState="paused"),window.dispatchEvent(new CustomEvent("otakon:ttsPaused")))},Je=()=>{m&&m.paused&&(m.resume(),"mediaSession"in navigator&&(navigator.mediaSession.playbackState="playing"),window.dispatchEvent(new CustomEvent("otakon:ttsResumed")))},Ve=async()=>{H&&(q(),await ye(H))},Xe=()=>m?m.speaking:!1,de=()=>{q(),window.dispatchEvent(new CustomEvent("otakon:disableHandsFree"))},Ze=()=>{"mediaSession"in navigator&&(navigator.mediaSession.setActionHandler("play",()=>{}),navigator.mediaSession.setActionHandler("pause",de),navigator.mediaSession.setActionHandler("stop",de))},Qe=async()=>{document.hidden?(re=!0,m&&m.speaking&&await ge()):(re=!1,m&&m.speaking&&await ne())},et=async()=>{if(typeof window<"u"&&"speechSynthesis"in window){if(ue)return;ue=!0,m=window.speechSynthesis,await Be(),Ze(),je(),document.addEventListener("visibilitychange",Qe),m.getVoices().length===0&&m.speak(new SpeechSynthesisUtterance(""))}},fe=()=>G.filter(i=>i.lang.startsWith("en-")),ye=async i=>new Promise((e,t)=>{try{if(!m)return console.error("Text-to-Speech is not available on this browser."),t(new Error("Text-to-Speech is not available on this browser."));if(!i.trim())return e();q(),H=i;const s=new SpeechSynthesisUtterance(i),r=localStorage.getItem(ze);s.rate=r?parseFloat(r):.94;const a=localStorage.getItem("otakonPreferredVoiceURI"),n=fe();let c;if(a&&(c=n.find(o=>o.voiceURI===a)),!c&&n.length>0){const o=n.find(u=>u.name.toLowerCase().includes("female"));o?c=o:c=n[0]}c&&(s.voice=c),s.onstart=async()=>{await ne(),await ge(),"serviceWorker"in navigator&&navigator.serviceWorker.controller&&navigator.serviceWorker.controller.postMessage({type:"TTS_STARTED"}),"mediaSession"in navigator&&(navigator.mediaSession.playbackState="playing",navigator.mediaSession.metadata=new MediaMetadata({title:i.length>50?i.substring(0,50)+"...":i,artist:"Your AI Gaming Companion",album:"Otakon",artwork:[{src:"/icon-192.png",sizes:"192x192",type:"image/png"},{src:"/icon-512.png",sizes:"512x512",type:"image/png"}]})),window.dispatchEvent(new CustomEvent("otakon:ttsStarted"))},s.onend=()=>{H="","mediaSession"in navigator&&(navigator.mediaSession.playbackState="paused"),"serviceWorker"in navigator&&navigator.serviceWorker.controller&&navigator.serviceWorker.controller.postMessage({type:"TTS_STOPPED"}),me(),pe(),window.dispatchEvent(new CustomEvent("otakon:ttsStopped")),e()},s.onerror=o=>{console.error("SpeechSynthesis Utterance Error",o),q(),t(o)},m.speak(s)}catch(s){console.error("TTS Error:",s),t(s)}}),Et={init:et,getAvailableVoices:fe,speak:ye,cancel:q,pause:Ye,resume:Je,restart:Ve,isSpeaking:Xe};class _t{static async migrateMessagesAtomic(e,t,s){const r=await y.getConversations(!1),a=r[t],n=r[s];if(!a)throw console.error("📦 [MessageRouting] Source conversation not found:",t),console.error("📦 [MessageRouting] Available conversations:",Object.keys(r)),new Error(`Source conversation ${t} not found`);if(!n)throw console.error("📦 [MessageRouting] Destination conversation not found:",s),console.error("📦 [MessageRouting] Available conversations:",Object.keys(r)),new Error(`Destination conversation ${s} not found`);const c=a.messages.filter(h=>e.includes(h.id));if(c.length===0)return;const o=c.filter(h=>!n.messages.some(f=>f.id===h.id)),u={...r,[s]:{...n,messages:[...n.messages,...o],updatedAt:Date.now()},[t]:{...a,messages:a.messages.filter(h=>!e.includes(h.id)),updatedAt:Date.now()}};await y.setConversations(u)}static shouldRouteMessage(e,t,s){return!t||e===t?!1:!!(s&&t)}static messageExists(e,t){return e.some(s=>s.id===t)}}class tt{constructor(){d(this,"MAX_WORDS",300);d(this,"RECENT_MESSAGE_COUNT",8)}countWords(e){return e.trim().split(/\s+/).filter(t=>t.length>0).length}getTotalWordCount(e){return e.reduce((t,s)=>{const r=this.countWords(s.content);return t+r},0)}shouldSummarize(e){return!e.messages||e.messages.length<=this.RECENT_MESSAGE_COUNT?!1:this.getTotalWordCount(e.messages)>this.MAX_WORDS*3}splitMessages(e){if(e.length<=this.RECENT_MESSAGE_COUNT)return{toSummarize:[],toKeep:e};const t=e.length-this.RECENT_MESSAGE_COUNT;return{toSummarize:e.slice(0,t),toKeep:e.slice(t)}}async summarizeMessages(e,t,s){const r=this.getTotalWordCount(e),a=e.map(o=>`${o.role==="user"?"User":"Assistant"}: ${o.content}`).join(`

`),c=`${t&&s?`This is a conversation about "${t}" (${s}).`:"This is a general conversation."}

Please provide a concise summary of the following conversation history. Focus on:
- Key topics discussed
- Important decisions or choices made
- Game progress or story developments (if applicable)
- User preferences or interests mentioned

Keep the summary under ${this.MAX_WORDS} words while preserving essential context.

Conversation to summarize:
${a}

Provide ONLY the summary, no additional commentary.`;try{const o={id:"temp-summary",title:"Summary Request",messages:[{id:"summary-msg-"+Date.now(),role:"user",content:c,timestamp:Date.now()}],createdAt:Date.now(),updatedAt:Date.now(),isActive:!1,isGameHub:!1},u={id:"system",email:"system@otakon.ai",profileData:null},f=(await he.getChatResponse(o,u,c,!1,!1)).content.trim(),b=this.countWords(f);return console.log(`✅ [ContextSummarization] Summary generated: ${b} words (reduced from ${r})`),{summary:f,wordCount:b,messagesIncluded:e.length,originalWordCount:r}}catch(o){console.error("❌ [ContextSummarization] Failed to generate summary:",o);const u=e.slice(0,5).map(h=>h.content.substring(0,100)).join(" ... ").substring(0,this.MAX_WORDS*6);return{summary:`[Previous conversation context] ${u}`,wordCount:this.countWords(u),messagesIncluded:e.length,originalWordCount:r}}}async applyContextSummarization(e){if(!this.shouldSummarize(e))return e;const{toSummarize:t,toKeep:s}=this.splitMessages(e.messages);if(t.length===0)return e;const r=await this.summarizeMessages(t,e.gameTitle,e.genre),n=[{id:"summary-"+Date.now(),role:"system",content:r.summary,timestamp:t[t.length-1].timestamp,metadata:{isSummary:!0,messagesIncluded:r.messagesIncluded,originalWordCount:r.originalWordCount,summaryWordCount:r.wordCount}},...s],c=r.summary.replace(/!\[.*?\]\(data:image\/.*?\)/g,""),o=c.split(/\s+/).filter(h=>h.length>0),u=o.length>500?o.slice(0,500).join(" ")+"...":c;return console.log(`✅ [ContextSummarization] Context optimized: ${e.messages.length} messages → ${n.length} (${r.originalWordCount} words → ${r.wordCount} + recent)`),{...e,messages:n,contextSummary:u,lastSummarizedAt:Date.now(),updatedAt:Date.now()}}async getOptimizedContext(e){return this.shouldSummarize(e)?(await this.applyContextSummarization(e)).messages:e.messages}willTriggerSummarization(e){return this.getTotalWordCount(e.messages)>this.MAX_WORDS*3*.8}}const st=new tt,At=Object.freeze(Object.defineProperty({__proto__:null,contextSummarizationService:st},Symbol.toStringTag,{value:"Module"}));export{j as E,_t as M,O as S,Tt as U,ht as W,w as a,pt as b,mt as c,bt as d,yt as e,D as f,ft as g,ut as h,Et as i,St as j,vt as k,Ct as l,xe as m,wt as n,dt as o,gt as p,lt as q,At as r,Oe as s,$ as t};
//# sourceMappingURL=services-AnWpvxrS.js.map
