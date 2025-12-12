var Hf=Object.defineProperty;var Uf=(l,s,a)=>s in l?Hf(l,s,{enumerable:!0,configurable:!0,writable:!0,value:a}):l[s]=a;var Dn=(l,s,a)=>Uf(l,typeof s!="symbol"?s+"":s,a);import{aa as $f,ab as uc,ac as Bf}from"./vendor-B9Aw4EYg.js";import{E as sc}from"./carousel-vendor-DbqMuwPS.js";function zc(l,s){for(var a=0;a<s.length;a++){const c=s[a];if(typeof c!="string"&&!Array.isArray(c)){for(const h in c)if(h!=="default"&&!(h in l)){const v=Object.getOwnPropertyDescriptor(c,h);v&&Object.defineProperty(l,h,v.get?v:{enumerable:!0,get:()=>c[h]})}}}return Object.freeze(Object.defineProperty(l,Symbol.toStringTag,{value:"Module"}))}function ti(l){return l&&l.__esModule&&Object.prototype.hasOwnProperty.call(l,"default")?l.default:l}function Yp(l){if(Object.prototype.hasOwnProperty.call(l,"__esModule"))return l;var s=l.default;if(typeof s=="function"){var a=function c(){return this instanceof c?Reflect.construct(s,arguments,this.constructor):s.apply(this,arguments)};a.prototype=s.prototype}else a={};return Object.defineProperty(a,"__esModule",{value:!0}),Object.keys(l).forEach(function(c){var h=Object.getOwnPropertyDescriptor(l,c);Object.defineProperty(a,c,h.get?h:{enumerable:!0,get:function(){return l[c]}})}),a}var Zl={exports:{}},Rr={},Gl={exports:{}},$={};/**
 * @license React
 * react.production.min.js
 *
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */var cc;function Vf(){if(cc)return $;cc=1;var l=Symbol.for("react.element"),s=Symbol.for("react.portal"),a=Symbol.for("react.fragment"),c=Symbol.for("react.strict_mode"),h=Symbol.for("react.profiler"),v=Symbol.for("react.provider"),k=Symbol.for("react.context"),w=Symbol.for("react.forward_ref"),x=Symbol.for("react.suspense"),_=Symbol.for("react.memo"),A=Symbol.for("react.lazy"),X=Symbol.iterator;function W(y){return y===null||typeof y!="object"?null:(y=X&&y[X]||y["@@iterator"],typeof y=="function"?y:null)}var J={isMounted:function(){return!1},enqueueForceUpdate:function(){},enqueueReplaceState:function(){},enqueueSetState:function(){}},U=Object.assign,C={};function j(y,T,V){this.props=y,this.context=T,this.refs=C,this.updater=V||J}j.prototype.isReactComponent={},j.prototype.setState=function(y,T){if(typeof y!="object"&&typeof y!="function"&&y!=null)throw Error("setState(...): takes an object of state variables to update or a function which returns an object of state variables.");this.updater.enqueueSetState(this,y,T,"setState")},j.prototype.forceUpdate=function(y){this.updater.enqueueForceUpdate(this,y,"forceUpdate")};function ze(){}ze.prototype=j.prototype;function De(y,T,V){this.props=y,this.context=T,this.refs=C,this.updater=V||J}var be=De.prototype=new ze;be.constructor=De,U(be,j.prototype),be.isPureReactComponent=!0;var he=Array.isArray,Me=Object.prototype.hasOwnProperty,ke={current:null},Ee={key:!0,ref:!0,__self:!0,__source:!0};function Ze(y,T,V){var K,G={},oe=null,de=null;if(T!=null)for(K in T.ref!==void 0&&(de=T.ref),T.key!==void 0&&(oe=""+T.key),T)Me.call(T,K)&&!Ee.hasOwnProperty(K)&&(G[K]=T[K]);var Y=arguments.length-2;if(Y===1)G.children=V;else if(1<Y){for(var ie=Array(Y),We=0;We<Y;We++)ie[We]=arguments[We+2];G.children=ie}if(y&&y.defaultProps)for(K in Y=y.defaultProps,Y)G[K]===void 0&&(G[K]=Y[K]);return{$$typeof:l,type:y,key:oe,ref:de,props:G,_owner:ke.current}}function _e(y,T){return{$$typeof:l,type:y.type,key:T,ref:y.ref,props:y.props,_owner:y._owner}}function yt(y){return typeof y=="object"&&y!==null&&y.$$typeof===l}function jr(y){var T={"=":"=0",":":"=2"};return"$"+y.replace(/[=:]/g,function(V){return T[V]})}var bt=/\/+/g;function nt(y,T){return typeof y=="object"&&y!==null&&y.key!=null?jr(""+y.key):T.toString(36)}function Rn(y,T,V,K,G){var oe=typeof y;(oe==="undefined"||oe==="boolean")&&(y=null);var de=!1;if(y===null)de=!0;else switch(oe){case"string":case"number":de=!0;break;case"object":switch(y.$$typeof){case l:case s:de=!0}}if(de)return de=y,G=G(de),y=K===""?"."+nt(de,0):K,he(G)?(V="",y!=null&&(V=y.replace(bt,"$&/")+"/"),Rn(G,T,V,"",function(We){return We})):G!=null&&(yt(G)&&(G=_e(G,V+(!G.key||de&&de.key===G.key?"":(""+G.key).replace(bt,"$&/")+"/")+y)),T.push(G)),1;if(de=0,K=K===""?".":K+":",he(y))for(var Y=0;Y<y.length;Y++){oe=y[Y];var ie=K+nt(oe,Y);de+=Rn(oe,T,V,ie,G)}else if(ie=W(y),typeof ie=="function")for(y=ie.call(y),Y=0;!(oe=y.next()).done;)oe=oe.value,ie=K+nt(oe,Y++),de+=Rn(oe,T,V,ie,G);else if(oe==="object")throw T=String(y),Error("Objects are not valid as a React child (found: "+(T==="[object Object]"?"object with keys {"+Object.keys(y).join(", ")+"}":T)+"). If you meant to render a collection of children, use an array instead.");return de}function Nn(y,T,V){if(y==null)return y;var K=[],G=0;return Rn(y,K,"","",function(oe){return T.call(V,oe,G++)}),K}function vn(y){if(y._status===-1){var T=y._result;T=T(),T.then(function(V){(y._status===0||y._status===-1)&&(y._status=1,y._result=V)},function(V){(y._status===0||y._status===-1)&&(y._status=2,y._result=V)}),y._status===-1&&(y._status=0,y._result=T)}if(y._status===1)return y._result.default;throw y._result}var xe={current:null},tt={transition:null},rt={ReactCurrentDispatcher:xe,ReactCurrentBatchConfig:tt,ReactCurrentOwner:ke};function ee(){throw Error("act(...) is not supported in production builds of React.")}return $.Children={map:Nn,forEach:function(y,T,V){Nn(y,function(){T.apply(this,arguments)},V)},count:function(y){var T=0;return Nn(y,function(){T++}),T},toArray:function(y){return Nn(y,function(T){return T})||[]},only:function(y){if(!yt(y))throw Error("React.Children.only expected to receive a single React element child.");return y}},$.Component=j,$.Fragment=a,$.Profiler=h,$.PureComponent=De,$.StrictMode=c,$.Suspense=x,$.__SECRET_INTERNALS_DO_NOT_USE_OR_YOU_WILL_BE_FIRED=rt,$.act=ee,$.cloneElement=function(y,T,V){if(y==null)throw Error("React.cloneElement(...): The argument must be a React element, but you passed "+y+".");var K=U({},y.props),G=y.key,oe=y.ref,de=y._owner;if(T!=null){if(T.ref!==void 0&&(oe=T.ref,de=ke.current),T.key!==void 0&&(G=""+T.key),y.type&&y.type.defaultProps)var Y=y.type.defaultProps;for(ie in T)Me.call(T,ie)&&!Ee.hasOwnProperty(ie)&&(K[ie]=T[ie]===void 0&&Y!==void 0?Y[ie]:T[ie])}var ie=arguments.length-2;if(ie===1)K.children=V;else if(1<ie){Y=Array(ie);for(var We=0;We<ie;We++)Y[We]=arguments[We+2];K.children=Y}return{$$typeof:l,type:y.type,key:G,ref:oe,props:K,_owner:de}},$.createContext=function(y){return y={$$typeof:k,_currentValue:y,_currentValue2:y,_threadCount:0,Provider:null,Consumer:null,_defaultValue:null,_globalName:null},y.Provider={$$typeof:v,_context:y},y.Consumer=y},$.createElement=Ze,$.createFactory=function(y){var T=Ze.bind(null,y);return T.type=y,T},$.createRef=function(){return{current:null}},$.forwardRef=function(y){return{$$typeof:w,render:y}},$.isValidElement=yt,$.lazy=function(y){return{$$typeof:A,_payload:{_status:-1,_result:y},_init:vn}},$.memo=function(y,T){return{$$typeof:_,type:y,compare:T===void 0?null:T}},$.startTransition=function(y){var T=tt.transition;tt.transition={};try{y()}finally{tt.transition=T}},$.unstable_act=ee,$.useCallback=function(y,T){return xe.current.useCallback(y,T)},$.useContext=function(y){return xe.current.useContext(y)},$.useDebugValue=function(){},$.useDeferredValue=function(y){return xe.current.useDeferredValue(y)},$.useEffect=function(y,T){return xe.current.useEffect(y,T)},$.useId=function(){return xe.current.useId()},$.useImperativeHandle=function(y,T,V){return xe.current.useImperativeHandle(y,T,V)},$.useInsertionEffect=function(y,T){return xe.current.useInsertionEffect(y,T)},$.useLayoutEffect=function(y,T){return xe.current.useLayoutEffect(y,T)},$.useMemo=function(y,T){return xe.current.useMemo(y,T)},$.useReducer=function(y,T,V){return xe.current.useReducer(y,T,V)},$.useRef=function(y){return xe.current.useRef(y)},$.useState=function(y){return xe.current.useState(y)},$.useSyncExternalStore=function(y,T,V){return xe.current.useSyncExternalStore(y,T,V)},$.useTransition=function(){return xe.current.useTransition()},$.version="18.3.1",$}var dc;function da(){return dc||(dc=1,Gl.exports=Vf()),Gl.exports}/**
 * @license React
 * react-jsx-runtime.production.min.js
 *
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */var fc;function Wf(){if(fc)return Rr;fc=1;var l=da(),s=Symbol.for("react.element"),a=Symbol.for("react.fragment"),c=Object.prototype.hasOwnProperty,h=l.__SECRET_INTERNALS_DO_NOT_USE_OR_YOU_WILL_BE_FIRED.ReactCurrentOwner,v={key:!0,ref:!0,__self:!0,__source:!0};function k(w,x,_){var A,X={},W=null,J=null;_!==void 0&&(W=""+_),x.key!==void 0&&(W=""+x.key),x.ref!==void 0&&(J=x.ref);for(A in x)c.call(x,A)&&!v.hasOwnProperty(A)&&(X[A]=x[A]);if(w&&w.defaultProps)for(A in x=w.defaultProps,x)X[A]===void 0&&(X[A]=x[A]);return{$$typeof:s,type:w,key:W,ref:J,props:X,_owner:h.current}}return Rr.Fragment=a,Rr.jsx=k,Rr.jsxs=k,Rr}var pc;function Qf(){return pc||(pc=1,Zl.exports=Wf()),Zl.exports}var Zp=Qf(),B=da();const Oe=ti(B),Gp=zc({__proto__:null,default:Oe},[B]);var Ko={},Jl={exports:{}},Ve={};/**
 * @license React
 * react-dom.production.min.js
 *
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */var hc;function qf(){if(hc)return Ve;hc=1;var l=da(),s=$f();function a(e){for(var n="https://reactjs.org/docs/error-decoder.html?invariant="+e,t=1;t<arguments.length;t++)n+="&args[]="+encodeURIComponent(arguments[t]);return"Minified React error #"+e+"; visit "+n+" for the full message or use the non-minified dev environment for full errors and additional helpful warnings."}var c=new Set,h={};function v(e,n){k(e,n),k(e+"Capture",n)}function k(e,n){for(h[e]=n,e=0;e<n.length;e++)c.add(n[e])}var w=!(typeof window>"u"||typeof window.document>"u"||typeof window.document.createElement>"u"),x=Object.prototype.hasOwnProperty,_=/^[:A-Z_a-z\u00C0-\u00D6\u00D8-\u00F6\u00F8-\u02FF\u0370-\u037D\u037F-\u1FFF\u200C-\u200D\u2070-\u218F\u2C00-\u2FEF\u3001-\uD7FF\uF900-\uFDCF\uFDF0-\uFFFD][:A-Z_a-z\u00C0-\u00D6\u00D8-\u00F6\u00F8-\u02FF\u0370-\u037D\u037F-\u1FFF\u200C-\u200D\u2070-\u218F\u2C00-\u2FEF\u3001-\uD7FF\uF900-\uFDCF\uFDF0-\uFFFD\-.0-9\u00B7\u0300-\u036F\u203F-\u2040]*$/,A={},X={};function W(e){return x.call(X,e)?!0:x.call(A,e)?!1:_.test(e)?X[e]=!0:(A[e]=!0,!1)}function J(e,n,t,r){if(t!==null&&t.type===0)return!1;switch(typeof n){case"function":case"symbol":return!0;case"boolean":return r?!1:t!==null?!t.acceptsBooleans:(e=e.toLowerCase().slice(0,5),e!=="data-"&&e!=="aria-");default:return!1}}function U(e,n,t,r){if(n===null||typeof n>"u"||J(e,n,t,r))return!0;if(r)return!1;if(t!==null)switch(t.type){case 3:return!n;case 4:return n===!1;case 5:return isNaN(n);case 6:return isNaN(n)||1>n}return!1}function C(e,n,t,r,o,i,u){this.acceptsBooleans=n===2||n===3||n===4,this.attributeName=r,this.attributeNamespace=o,this.mustUseProperty=t,this.propertyName=e,this.type=n,this.sanitizeURL=i,this.removeEmptyString=u}var j={};"children dangerouslySetInnerHTML defaultValue defaultChecked innerHTML suppressContentEditableWarning suppressHydrationWarning style".split(" ").forEach(function(e){j[e]=new C(e,0,!1,e,null,!1,!1)}),[["acceptCharset","accept-charset"],["className","class"],["htmlFor","for"],["httpEquiv","http-equiv"]].forEach(function(e){var n=e[0];j[n]=new C(n,1,!1,e[1],null,!1,!1)}),["contentEditable","draggable","spellCheck","value"].forEach(function(e){j[e]=new C(e,2,!1,e.toLowerCase(),null,!1,!1)}),["autoReverse","externalResourcesRequired","focusable","preserveAlpha"].forEach(function(e){j[e]=new C(e,2,!1,e,null,!1,!1)}),"allowFullScreen async autoFocus autoPlay controls default defer disabled disablePictureInPicture disableRemotePlayback formNoValidate hidden loop noModule noValidate open playsInline readOnly required reversed scoped seamless itemScope".split(" ").forEach(function(e){j[e]=new C(e,3,!1,e.toLowerCase(),null,!1,!1)}),["checked","multiple","muted","selected"].forEach(function(e){j[e]=new C(e,3,!0,e,null,!1,!1)}),["capture","download"].forEach(function(e){j[e]=new C(e,4,!1,e,null,!1,!1)}),["cols","rows","size","span"].forEach(function(e){j[e]=new C(e,6,!1,e,null,!1,!1)}),["rowSpan","start"].forEach(function(e){j[e]=new C(e,5,!1,e.toLowerCase(),null,!1,!1)});var ze=/[\-:]([a-z])/g;function De(e){return e[1].toUpperCase()}"accent-height alignment-baseline arabic-form baseline-shift cap-height clip-path clip-rule color-interpolation color-interpolation-filters color-profile color-rendering dominant-baseline enable-background fill-opacity fill-rule flood-color flood-opacity font-family font-size font-size-adjust font-stretch font-style font-variant font-weight glyph-name glyph-orientation-horizontal glyph-orientation-vertical horiz-adv-x horiz-origin-x image-rendering letter-spacing lighting-color marker-end marker-mid marker-start overline-position overline-thickness paint-order panose-1 pointer-events rendering-intent shape-rendering stop-color stop-opacity strikethrough-position strikethrough-thickness stroke-dasharray stroke-dashoffset stroke-linecap stroke-linejoin stroke-miterlimit stroke-opacity stroke-width text-anchor text-decoration text-rendering underline-position underline-thickness unicode-bidi unicode-range units-per-em v-alphabetic v-hanging v-ideographic v-mathematical vector-effect vert-adv-y vert-origin-x vert-origin-y word-spacing writing-mode xmlns:xlink x-height".split(" ").forEach(function(e){var n=e.replace(ze,De);j[n]=new C(n,1,!1,e,null,!1,!1)}),"xlink:actuate xlink:arcrole xlink:role xlink:show xlink:title xlink:type".split(" ").forEach(function(e){var n=e.replace(ze,De);j[n]=new C(n,1,!1,e,"http://www.w3.org/1999/xlink",!1,!1)}),["xml:base","xml:lang","xml:space"].forEach(function(e){var n=e.replace(ze,De);j[n]=new C(n,1,!1,e,"http://www.w3.org/XML/1998/namespace",!1,!1)}),["tabIndex","crossOrigin"].forEach(function(e){j[e]=new C(e,1,!1,e.toLowerCase(),null,!1,!1)}),j.xlinkHref=new C("xlinkHref",1,!1,"xlink:href","http://www.w3.org/1999/xlink",!0,!1),["src","href","action","formAction"].forEach(function(e){j[e]=new C(e,1,!1,e.toLowerCase(),null,!0,!0)});function be(e,n,t,r){var o=j.hasOwnProperty(n)?j[n]:null;(o!==null?o.type!==0:r||!(2<n.length)||n[0]!=="o"&&n[0]!=="O"||n[1]!=="n"&&n[1]!=="N")&&(U(n,t,o,r)&&(t=null),r||o===null?W(n)&&(t===null?e.removeAttribute(n):e.setAttribute(n,""+t)):o.mustUseProperty?e[o.propertyName]=t===null?o.type===3?!1:"":t:(n=o.attributeName,r=o.attributeNamespace,t===null?e.removeAttribute(n):(o=o.type,t=o===3||o===4&&t===!0?"":""+t,r?e.setAttributeNS(r,n,t):e.setAttribute(n,t))))}var he=l.__SECRET_INTERNALS_DO_NOT_USE_OR_YOU_WILL_BE_FIRED,Me=Symbol.for("react.element"),ke=Symbol.for("react.portal"),Ee=Symbol.for("react.fragment"),Ze=Symbol.for("react.strict_mode"),_e=Symbol.for("react.profiler"),yt=Symbol.for("react.provider"),jr=Symbol.for("react.context"),bt=Symbol.for("react.forward_ref"),nt=Symbol.for("react.suspense"),Rn=Symbol.for("react.suspense_list"),Nn=Symbol.for("react.memo"),vn=Symbol.for("react.lazy"),xe=Symbol.for("react.offscreen"),tt=Symbol.iterator;function rt(e){return e===null||typeof e!="object"?null:(e=tt&&e[tt]||e["@@iterator"],typeof e=="function"?e:null)}var ee=Object.assign,y;function T(e){if(y===void 0)try{throw Error()}catch(t){var n=t.stack.trim().match(/\n( *(at )?)/);y=n&&n[1]||""}return`
`+y+e}var V=!1;function K(e,n){if(!e||V)return"";V=!0;var t=Error.prepareStackTrace;Error.prepareStackTrace=void 0;try{if(n)if(n=function(){throw Error()},Object.defineProperty(n.prototype,"props",{set:function(){throw Error()}}),typeof Reflect=="object"&&Reflect.construct){try{Reflect.construct(n,[])}catch(b){var r=b}Reflect.construct(e,[],n)}else{try{n.call()}catch(b){r=b}e.call(n.prototype)}else{try{throw Error()}catch(b){r=b}e()}}catch(b){if(b&&r&&typeof b.stack=="string"){for(var o=b.stack.split(`
`),i=r.stack.split(`
`),u=o.length-1,d=i.length-1;1<=u&&0<=d&&o[u]!==i[d];)d--;for(;1<=u&&0<=d;u--,d--)if(o[u]!==i[d]){if(u!==1||d!==1)do if(u--,d--,0>d||o[u]!==i[d]){var f=`
`+o[u].replace(" at new "," at ");return e.displayName&&f.includes("<anonymous>")&&(f=f.replace("<anonymous>",e.displayName)),f}while(1<=u&&0<=d);break}}}finally{V=!1,Error.prepareStackTrace=t}return(e=e?e.displayName||e.name:"")?T(e):""}function G(e){switch(e.tag){case 5:return T(e.type);case 16:return T("Lazy");case 13:return T("Suspense");case 19:return T("SuspenseList");case 0:case 2:case 15:return e=K(e.type,!1),e;case 11:return e=K(e.type.render,!1),e;case 1:return e=K(e.type,!0),e;default:return""}}function oe(e){if(e==null)return null;if(typeof e=="function")return e.displayName||e.name||null;if(typeof e=="string")return e;switch(e){case Ee:return"Fragment";case ke:return"Portal";case _e:return"Profiler";case Ze:return"StrictMode";case nt:return"Suspense";case Rn:return"SuspenseList"}if(typeof e=="object")switch(e.$$typeof){case jr:return(e.displayName||"Context")+".Consumer";case yt:return(e._context.displayName||"Context")+".Provider";case bt:var n=e.render;return e=e.displayName,e||(e=n.displayName||n.name||"",e=e!==""?"ForwardRef("+e+")":"ForwardRef"),e;case Nn:return n=e.displayName||null,n!==null?n:oe(e.type)||"Memo";case vn:n=e._payload,e=e._init;try{return oe(e(n))}catch{}}return null}function de(e){var n=e.type;switch(e.tag){case 24:return"Cache";case 9:return(n.displayName||"Context")+".Consumer";case 10:return(n._context.displayName||"Context")+".Provider";case 18:return"DehydratedFragment";case 11:return e=n.render,e=e.displayName||e.name||"",n.displayName||(e!==""?"ForwardRef("+e+")":"ForwardRef");case 7:return"Fragment";case 5:return n;case 4:return"Portal";case 3:return"Root";case 6:return"Text";case 16:return oe(n);case 8:return n===Ze?"StrictMode":"Mode";case 22:return"Offscreen";case 12:return"Profiler";case 21:return"Scope";case 13:return"Suspense";case 19:return"SuspenseList";case 25:return"TracingMarker";case 1:case 0:case 17:case 2:case 14:case 15:if(typeof n=="function")return n.displayName||n.name||null;if(typeof n=="string")return n}return null}function Y(e){switch(typeof e){case"boolean":case"number":case"string":case"undefined":return e;case"object":return e;default:return""}}function ie(e){var n=e.type;return(e=e.nodeName)&&e.toLowerCase()==="input"&&(n==="checkbox"||n==="radio")}function We(e){var n=ie(e)?"checked":"value",t=Object.getOwnPropertyDescriptor(e.constructor.prototype,n),r=""+e[n];if(!e.hasOwnProperty(n)&&typeof t<"u"&&typeof t.get=="function"&&typeof t.set=="function"){var o=t.get,i=t.set;return Object.defineProperty(e,n,{configurable:!0,get:function(){return o.call(this)},set:function(u){r=""+u,i.call(this,u)}}),Object.defineProperty(e,n,{enumerable:t.enumerable}),{getValue:function(){return r},setValue:function(u){r=""+u},stopTracking:function(){e._valueTracker=null,delete e[n]}}}}function Fr(e){e._valueTracker||(e._valueTracker=We(e))}function ha(e){if(!e)return!1;var n=e._valueTracker;if(!n)return!0;var t=n.getValue(),r="";return e&&(r=ie(e)?e.checked?"true":"false":e.value),e=r,e!==t?(n.setValue(e),!0):!1}function Ir(e){if(e=e||(typeof document<"u"?document:void 0),typeof e>"u")return null;try{return e.activeElement||e.body}catch{return e.body}}function oi(e,n){var t=n.checked;return ee({},n,{defaultChecked:void 0,defaultValue:void 0,value:void 0,checked:t??e._wrapperState.initialChecked})}function ma(e,n){var t=n.defaultValue==null?"":n.defaultValue,r=n.checked!=null?n.checked:n.defaultChecked;t=Y(n.value!=null?n.value:t),e._wrapperState={initialChecked:r,initialValue:t,controlled:n.type==="checkbox"||n.type==="radio"?n.checked!=null:n.value!=null}}function va(e,n){n=n.checked,n!=null&&be(e,"checked",n,!1)}function ii(e,n){va(e,n);var t=Y(n.value),r=n.type;if(t!=null)r==="number"?(t===0&&e.value===""||e.value!=t)&&(e.value=""+t):e.value!==""+t&&(e.value=""+t);else if(r==="submit"||r==="reset"){e.removeAttribute("value");return}n.hasOwnProperty("value")?li(e,n.type,t):n.hasOwnProperty("defaultValue")&&li(e,n.type,Y(n.defaultValue)),n.checked==null&&n.defaultChecked!=null&&(e.defaultChecked=!!n.defaultChecked)}function ga(e,n,t){if(n.hasOwnProperty("value")||n.hasOwnProperty("defaultValue")){var r=n.type;if(!(r!=="submit"&&r!=="reset"||n.value!==void 0&&n.value!==null))return;n=""+e._wrapperState.initialValue,t||n===e.value||(e.value=n),e.defaultValue=n}t=e.name,t!==""&&(e.name=""),e.defaultChecked=!!e._wrapperState.initialChecked,t!==""&&(e.name=t)}function li(e,n,t){(n!=="number"||Ir(e.ownerDocument)!==e)&&(t==null?e.defaultValue=""+e._wrapperState.initialValue:e.defaultValue!==""+t&&(e.defaultValue=""+t))}var Xt=Array.isArray;function kt(e,n,t,r){if(e=e.options,n){n={};for(var o=0;o<t.length;o++)n["$"+t[o]]=!0;for(t=0;t<e.length;t++)o=n.hasOwnProperty("$"+e[t].value),e[t].selected!==o&&(e[t].selected=o),o&&r&&(e[t].defaultSelected=!0)}else{for(t=""+Y(t),n=null,o=0;o<e.length;o++){if(e[o].value===t){e[o].selected=!0,r&&(e[o].defaultSelected=!0);return}n!==null||e[o].disabled||(n=e[o])}n!==null&&(n.selected=!0)}}function ai(e,n){if(n.dangerouslySetInnerHTML!=null)throw Error(a(91));return ee({},n,{value:void 0,defaultValue:void 0,children:""+e._wrapperState.initialValue})}function ya(e,n){var t=n.value;if(t==null){if(t=n.children,n=n.defaultValue,t!=null){if(n!=null)throw Error(a(92));if(Xt(t)){if(1<t.length)throw Error(a(93));t=t[0]}n=t}n==null&&(n=""),t=n}e._wrapperState={initialValue:Y(t)}}function ba(e,n){var t=Y(n.value),r=Y(n.defaultValue);t!=null&&(t=""+t,t!==e.value&&(e.value=t),n.defaultValue==null&&e.defaultValue!==t&&(e.defaultValue=t)),r!=null&&(e.defaultValue=""+r)}function ka(e){var n=e.textContent;n===e._wrapperState.initialValue&&n!==""&&n!==null&&(e.value=n)}function xa(e){switch(e){case"svg":return"http://www.w3.org/2000/svg";case"math":return"http://www.w3.org/1998/Math/MathML";default:return"http://www.w3.org/1999/xhtml"}}function ui(e,n){return e==null||e==="http://www.w3.org/1999/xhtml"?xa(n):e==="http://www.w3.org/2000/svg"&&n==="foreignObject"?"http://www.w3.org/1999/xhtml":e}var Hr,wa=(function(e){return typeof MSApp<"u"&&MSApp.execUnsafeLocalFunction?function(n,t,r,o){MSApp.execUnsafeLocalFunction(function(){return e(n,t,r,o)})}:e})(function(e,n){if(e.namespaceURI!=="http://www.w3.org/2000/svg"||"innerHTML"in e)e.innerHTML=n;else{for(Hr=Hr||document.createElement("div"),Hr.innerHTML="<svg>"+n.valueOf().toString()+"</svg>",n=Hr.firstChild;e.firstChild;)e.removeChild(e.firstChild);for(;n.firstChild;)e.appendChild(n.firstChild)}});function Kt(e,n){if(n){var t=e.firstChild;if(t&&t===e.lastChild&&t.nodeType===3){t.nodeValue=n;return}}e.textContent=n}var Yt={animationIterationCount:!0,aspectRatio:!0,borderImageOutset:!0,borderImageSlice:!0,borderImageWidth:!0,boxFlex:!0,boxFlexGroup:!0,boxOrdinalGroup:!0,columnCount:!0,columns:!0,flex:!0,flexGrow:!0,flexPositive:!0,flexShrink:!0,flexNegative:!0,flexOrder:!0,gridArea:!0,gridRow:!0,gridRowEnd:!0,gridRowSpan:!0,gridRowStart:!0,gridColumn:!0,gridColumnEnd:!0,gridColumnSpan:!0,gridColumnStart:!0,fontWeight:!0,lineClamp:!0,lineHeight:!0,opacity:!0,order:!0,orphans:!0,tabSize:!0,widows:!0,zIndex:!0,zoom:!0,fillOpacity:!0,floodOpacity:!0,stopOpacity:!0,strokeDasharray:!0,strokeDashoffset:!0,strokeMiterlimit:!0,strokeOpacity:!0,strokeWidth:!0},Bc=["Webkit","ms","Moz","O"];Object.keys(Yt).forEach(function(e){Bc.forEach(function(n){n=n+e.charAt(0).toUpperCase()+e.substring(1),Yt[n]=Yt[e]})});function Sa(e,n,t){return n==null||typeof n=="boolean"||n===""?"":t||typeof n!="number"||n===0||Yt.hasOwnProperty(e)&&Yt[e]?(""+n).trim():n+"px"}function Pa(e,n){e=e.style;for(var t in n)if(n.hasOwnProperty(t)){var r=t.indexOf("--")===0,o=Sa(t,n[t],r);t==="float"&&(t="cssFloat"),r?e.setProperty(t,o):e[t]=o}}var Vc=ee({menuitem:!0},{area:!0,base:!0,br:!0,col:!0,embed:!0,hr:!0,img:!0,input:!0,keygen:!0,link:!0,meta:!0,param:!0,source:!0,track:!0,wbr:!0});function si(e,n){if(n){if(Vc[e]&&(n.children!=null||n.dangerouslySetInnerHTML!=null))throw Error(a(137,e));if(n.dangerouslySetInnerHTML!=null){if(n.children!=null)throw Error(a(60));if(typeof n.dangerouslySetInnerHTML!="object"||!("__html"in n.dangerouslySetInnerHTML))throw Error(a(61))}if(n.style!=null&&typeof n.style!="object")throw Error(a(62))}}function ci(e,n){if(e.indexOf("-")===-1)return typeof n.is=="string";switch(e){case"annotation-xml":case"color-profile":case"font-face":case"font-face-src":case"font-face-uri":case"font-face-format":case"font-face-name":case"missing-glyph":return!1;default:return!0}}var di=null;function fi(e){return e=e.target||e.srcElement||window,e.correspondingUseElement&&(e=e.correspondingUseElement),e.nodeType===3?e.parentNode:e}var pi=null,xt=null,wt=null;function Oa(e){if(e=yr(e)){if(typeof pi!="function")throw Error(a(280));var n=e.stateNode;n&&(n=so(n),pi(e.stateNode,e.type,n))}}function Ea(e){xt?wt?wt.push(e):wt=[e]:xt=e}function _a(){if(xt){var e=xt,n=wt;if(wt=xt=null,Oa(e),n)for(e=0;e<n.length;e++)Oa(n[e])}}function Ca(e,n){return e(n)}function Ta(){}var hi=!1;function za(e,n,t){if(hi)return e(n,t);hi=!0;try{return Ca(e,n,t)}finally{hi=!1,(xt!==null||wt!==null)&&(Ta(),_a())}}function Zt(e,n){var t=e.stateNode;if(t===null)return null;var r=so(t);if(r===null)return null;t=r[n];e:switch(n){case"onClick":case"onClickCapture":case"onDoubleClick":case"onDoubleClickCapture":case"onMouseDown":case"onMouseDownCapture":case"onMouseMove":case"onMouseMoveCapture":case"onMouseUp":case"onMouseUpCapture":case"onMouseEnter":(r=!r.disabled)||(e=e.type,r=!(e==="button"||e==="input"||e==="select"||e==="textarea")),e=!r;break e;default:e=!1}if(e)return null;if(t&&typeof t!="function")throw Error(a(231,n,typeof t));return t}var mi=!1;if(w)try{var Gt={};Object.defineProperty(Gt,"passive",{get:function(){mi=!0}}),window.addEventListener("test",Gt,Gt),window.removeEventListener("test",Gt,Gt)}catch{mi=!1}function Wc(e,n,t,r,o,i,u,d,f){var b=Array.prototype.slice.call(arguments,3);try{n.apply(t,b)}catch(P){this.onError(P)}}var Jt=!1,Ur=null,$r=!1,vi=null,Qc={onError:function(e){Jt=!0,Ur=e}};function qc(e,n,t,r,o,i,u,d,f){Jt=!1,Ur=null,Wc.apply(Qc,arguments)}function Xc(e,n,t,r,o,i,u,d,f){if(qc.apply(this,arguments),Jt){if(Jt){var b=Ur;Jt=!1,Ur=null}else throw Error(a(198));$r||($r=!0,vi=b)}}function ot(e){var n=e,t=e;if(e.alternate)for(;n.return;)n=n.return;else{e=n;do n=e,(n.flags&4098)!==0&&(t=n.return),e=n.return;while(e)}return n.tag===3?t:null}function Da(e){if(e.tag===13){var n=e.memoizedState;if(n===null&&(e=e.alternate,e!==null&&(n=e.memoizedState)),n!==null)return n.dehydrated}return null}function Ma(e){if(ot(e)!==e)throw Error(a(188))}function Kc(e){var n=e.alternate;if(!n){if(n=ot(e),n===null)throw Error(a(188));return n!==e?null:e}for(var t=e,r=n;;){var o=t.return;if(o===null)break;var i=o.alternate;if(i===null){if(r=o.return,r!==null){t=r;continue}break}if(o.child===i.child){for(i=o.child;i;){if(i===t)return Ma(o),e;if(i===r)return Ma(o),n;i=i.sibling}throw Error(a(188))}if(t.return!==r.return)t=o,r=i;else{for(var u=!1,d=o.child;d;){if(d===t){u=!0,t=o,r=i;break}if(d===r){u=!0,r=o,t=i;break}d=d.sibling}if(!u){for(d=i.child;d;){if(d===t){u=!0,t=i,r=o;break}if(d===r){u=!0,r=i,t=o;break}d=d.sibling}if(!u)throw Error(a(189))}}if(t.alternate!==r)throw Error(a(190))}if(t.tag!==3)throw Error(a(188));return t.stateNode.current===t?e:n}function Ra(e){return e=Kc(e),e!==null?Na(e):null}function Na(e){if(e.tag===5||e.tag===6)return e;for(e=e.child;e!==null;){var n=Na(e);if(n!==null)return n;e=e.sibling}return null}var Aa=s.unstable_scheduleCallback,La=s.unstable_cancelCallback,Yc=s.unstable_shouldYield,Zc=s.unstable_requestPaint,fe=s.unstable_now,Gc=s.unstable_getCurrentPriorityLevel,gi=s.unstable_ImmediatePriority,ja=s.unstable_UserBlockingPriority,Br=s.unstable_NormalPriority,Jc=s.unstable_LowPriority,Fa=s.unstable_IdlePriority,Vr=null,gn=null;function ed(e){if(gn&&typeof gn.onCommitFiberRoot=="function")try{gn.onCommitFiberRoot(Vr,e,void 0,(e.current.flags&128)===128)}catch{}}var ln=Math.clz32?Math.clz32:rd,nd=Math.log,td=Math.LN2;function rd(e){return e>>>=0,e===0?32:31-(nd(e)/td|0)|0}var Wr=64,Qr=4194304;function er(e){switch(e&-e){case 1:return 1;case 2:return 2;case 4:return 4;case 8:return 8;case 16:return 16;case 32:return 32;case 64:case 128:case 256:case 512:case 1024:case 2048:case 4096:case 8192:case 16384:case 32768:case 65536:case 131072:case 262144:case 524288:case 1048576:case 2097152:return e&4194240;case 4194304:case 8388608:case 16777216:case 33554432:case 67108864:return e&130023424;case 134217728:return 134217728;case 268435456:return 268435456;case 536870912:return 536870912;case 1073741824:return 1073741824;default:return e}}function qr(e,n){var t=e.pendingLanes;if(t===0)return 0;var r=0,o=e.suspendedLanes,i=e.pingedLanes,u=t&268435455;if(u!==0){var d=u&~o;d!==0?r=er(d):(i&=u,i!==0&&(r=er(i)))}else u=t&~o,u!==0?r=er(u):i!==0&&(r=er(i));if(r===0)return 0;if(n!==0&&n!==r&&(n&o)===0&&(o=r&-r,i=n&-n,o>=i||o===16&&(i&4194240)!==0))return n;if((r&4)!==0&&(r|=t&16),n=e.entangledLanes,n!==0)for(e=e.entanglements,n&=r;0<n;)t=31-ln(n),o=1<<t,r|=e[t],n&=~o;return r}function od(e,n){switch(e){case 1:case 2:case 4:return n+250;case 8:case 16:case 32:case 64:case 128:case 256:case 512:case 1024:case 2048:case 4096:case 8192:case 16384:case 32768:case 65536:case 131072:case 262144:case 524288:case 1048576:case 2097152:return n+5e3;case 4194304:case 8388608:case 16777216:case 33554432:case 67108864:return-1;case 134217728:case 268435456:case 536870912:case 1073741824:return-1;default:return-1}}function id(e,n){for(var t=e.suspendedLanes,r=e.pingedLanes,o=e.expirationTimes,i=e.pendingLanes;0<i;){var u=31-ln(i),d=1<<u,f=o[u];f===-1?((d&t)===0||(d&r)!==0)&&(o[u]=od(d,n)):f<=n&&(e.expiredLanes|=d),i&=~d}}function yi(e){return e=e.pendingLanes&-1073741825,e!==0?e:e&1073741824?1073741824:0}function Ia(){var e=Wr;return Wr<<=1,(Wr&4194240)===0&&(Wr=64),e}function bi(e){for(var n=[],t=0;31>t;t++)n.push(e);return n}function nr(e,n,t){e.pendingLanes|=n,n!==536870912&&(e.suspendedLanes=0,e.pingedLanes=0),e=e.eventTimes,n=31-ln(n),e[n]=t}function ld(e,n){var t=e.pendingLanes&~n;e.pendingLanes=n,e.suspendedLanes=0,e.pingedLanes=0,e.expiredLanes&=n,e.mutableReadLanes&=n,e.entangledLanes&=n,n=e.entanglements;var r=e.eventTimes;for(e=e.expirationTimes;0<t;){var o=31-ln(t),i=1<<o;n[o]=0,r[o]=-1,e[o]=-1,t&=~i}}function ki(e,n){var t=e.entangledLanes|=n;for(e=e.entanglements;t;){var r=31-ln(t),o=1<<r;o&n|e[r]&n&&(e[r]|=n),t&=~o}}var Z=0;function Ha(e){return e&=-e,1<e?4<e?(e&268435455)!==0?16:536870912:4:1}var Ua,xi,$a,Ba,Va,wi=!1,Xr=[],An=null,Ln=null,jn=null,tr=new Map,rr=new Map,Fn=[],ad="mousedown mouseup touchcancel touchend touchstart auxclick dblclick pointercancel pointerdown pointerup dragend dragstart drop compositionend compositionstart keydown keypress keyup input textInput copy cut paste click change contextmenu reset submit".split(" ");function Wa(e,n){switch(e){case"focusin":case"focusout":An=null;break;case"dragenter":case"dragleave":Ln=null;break;case"mouseover":case"mouseout":jn=null;break;case"pointerover":case"pointerout":tr.delete(n.pointerId);break;case"gotpointercapture":case"lostpointercapture":rr.delete(n.pointerId)}}function or(e,n,t,r,o,i){return e===null||e.nativeEvent!==i?(e={blockedOn:n,domEventName:t,eventSystemFlags:r,nativeEvent:i,targetContainers:[o]},n!==null&&(n=yr(n),n!==null&&xi(n)),e):(e.eventSystemFlags|=r,n=e.targetContainers,o!==null&&n.indexOf(o)===-1&&n.push(o),e)}function ud(e,n,t,r,o){switch(n){case"focusin":return An=or(An,e,n,t,r,o),!0;case"dragenter":return Ln=or(Ln,e,n,t,r,o),!0;case"mouseover":return jn=or(jn,e,n,t,r,o),!0;case"pointerover":var i=o.pointerId;return tr.set(i,or(tr.get(i)||null,e,n,t,r,o)),!0;case"gotpointercapture":return i=o.pointerId,rr.set(i,or(rr.get(i)||null,e,n,t,r,o)),!0}return!1}function Qa(e){var n=it(e.target);if(n!==null){var t=ot(n);if(t!==null){if(n=t.tag,n===13){if(n=Da(t),n!==null){e.blockedOn=n,Va(e.priority,function(){$a(t)});return}}else if(n===3&&t.stateNode.current.memoizedState.isDehydrated){e.blockedOn=t.tag===3?t.stateNode.containerInfo:null;return}}}e.blockedOn=null}function Kr(e){if(e.blockedOn!==null)return!1;for(var n=e.targetContainers;0<n.length;){var t=Pi(e.domEventName,e.eventSystemFlags,n[0],e.nativeEvent);if(t===null){t=e.nativeEvent;var r=new t.constructor(t.type,t);di=r,t.target.dispatchEvent(r),di=null}else return n=yr(t),n!==null&&xi(n),e.blockedOn=t,!1;n.shift()}return!0}function qa(e,n,t){Kr(e)&&t.delete(n)}function sd(){wi=!1,An!==null&&Kr(An)&&(An=null),Ln!==null&&Kr(Ln)&&(Ln=null),jn!==null&&Kr(jn)&&(jn=null),tr.forEach(qa),rr.forEach(qa)}function ir(e,n){e.blockedOn===n&&(e.blockedOn=null,wi||(wi=!0,s.unstable_scheduleCallback(s.unstable_NormalPriority,sd)))}function lr(e){function n(o){return ir(o,e)}if(0<Xr.length){ir(Xr[0],e);for(var t=1;t<Xr.length;t++){var r=Xr[t];r.blockedOn===e&&(r.blockedOn=null)}}for(An!==null&&ir(An,e),Ln!==null&&ir(Ln,e),jn!==null&&ir(jn,e),tr.forEach(n),rr.forEach(n),t=0;t<Fn.length;t++)r=Fn[t],r.blockedOn===e&&(r.blockedOn=null);for(;0<Fn.length&&(t=Fn[0],t.blockedOn===null);)Qa(t),t.blockedOn===null&&Fn.shift()}var St=he.ReactCurrentBatchConfig,Yr=!0;function cd(e,n,t,r){var o=Z,i=St.transition;St.transition=null;try{Z=1,Si(e,n,t,r)}finally{Z=o,St.transition=i}}function dd(e,n,t,r){var o=Z,i=St.transition;St.transition=null;try{Z=4,Si(e,n,t,r)}finally{Z=o,St.transition=i}}function Si(e,n,t,r){if(Yr){var o=Pi(e,n,t,r);if(o===null)Ui(e,n,r,Zr,t),Wa(e,r);else if(ud(o,e,n,t,r))r.stopPropagation();else if(Wa(e,r),n&4&&-1<ad.indexOf(e)){for(;o!==null;){var i=yr(o);if(i!==null&&Ua(i),i=Pi(e,n,t,r),i===null&&Ui(e,n,r,Zr,t),i===o)break;o=i}o!==null&&r.stopPropagation()}else Ui(e,n,r,null,t)}}var Zr=null;function Pi(e,n,t,r){if(Zr=null,e=fi(r),e=it(e),e!==null)if(n=ot(e),n===null)e=null;else if(t=n.tag,t===13){if(e=Da(n),e!==null)return e;e=null}else if(t===3){if(n.stateNode.current.memoizedState.isDehydrated)return n.tag===3?n.stateNode.containerInfo:null;e=null}else n!==e&&(e=null);return Zr=e,null}function Xa(e){switch(e){case"cancel":case"click":case"close":case"contextmenu":case"copy":case"cut":case"auxclick":case"dblclick":case"dragend":case"dragstart":case"drop":case"focusin":case"focusout":case"input":case"invalid":case"keydown":case"keypress":case"keyup":case"mousedown":case"mouseup":case"paste":case"pause":case"play":case"pointercancel":case"pointerdown":case"pointerup":case"ratechange":case"reset":case"resize":case"seeked":case"submit":case"touchcancel":case"touchend":case"touchstart":case"volumechange":case"change":case"selectionchange":case"textInput":case"compositionstart":case"compositionend":case"compositionupdate":case"beforeblur":case"afterblur":case"beforeinput":case"blur":case"fullscreenchange":case"focus":case"hashchange":case"popstate":case"select":case"selectstart":return 1;case"drag":case"dragenter":case"dragexit":case"dragleave":case"dragover":case"mousemove":case"mouseout":case"mouseover":case"pointermove":case"pointerout":case"pointerover":case"scroll":case"toggle":case"touchmove":case"wheel":case"mouseenter":case"mouseleave":case"pointerenter":case"pointerleave":return 4;case"message":switch(Gc()){case gi:return 1;case ja:return 4;case Br:case Jc:return 16;case Fa:return 536870912;default:return 16}default:return 16}}var In=null,Oi=null,Gr=null;function Ka(){if(Gr)return Gr;var e,n=Oi,t=n.length,r,o="value"in In?In.value:In.textContent,i=o.length;for(e=0;e<t&&n[e]===o[e];e++);var u=t-e;for(r=1;r<=u&&n[t-r]===o[i-r];r++);return Gr=o.slice(e,1<r?1-r:void 0)}function Jr(e){var n=e.keyCode;return"charCode"in e?(e=e.charCode,e===0&&n===13&&(e=13)):e=n,e===10&&(e=13),32<=e||e===13?e:0}function eo(){return!0}function Ya(){return!1}function Qe(e){function n(t,r,o,i,u){this._reactName=t,this._targetInst=o,this.type=r,this.nativeEvent=i,this.target=u,this.currentTarget=null;for(var d in e)e.hasOwnProperty(d)&&(t=e[d],this[d]=t?t(i):i[d]);return this.isDefaultPrevented=(i.defaultPrevented!=null?i.defaultPrevented:i.returnValue===!1)?eo:Ya,this.isPropagationStopped=Ya,this}return ee(n.prototype,{preventDefault:function(){this.defaultPrevented=!0;var t=this.nativeEvent;t&&(t.preventDefault?t.preventDefault():typeof t.returnValue!="unknown"&&(t.returnValue=!1),this.isDefaultPrevented=eo)},stopPropagation:function(){var t=this.nativeEvent;t&&(t.stopPropagation?t.stopPropagation():typeof t.cancelBubble!="unknown"&&(t.cancelBubble=!0),this.isPropagationStopped=eo)},persist:function(){},isPersistent:eo}),n}var Pt={eventPhase:0,bubbles:0,cancelable:0,timeStamp:function(e){return e.timeStamp||Date.now()},defaultPrevented:0,isTrusted:0},Ei=Qe(Pt),ar=ee({},Pt,{view:0,detail:0}),fd=Qe(ar),_i,Ci,ur,no=ee({},ar,{screenX:0,screenY:0,clientX:0,clientY:0,pageX:0,pageY:0,ctrlKey:0,shiftKey:0,altKey:0,metaKey:0,getModifierState:zi,button:0,buttons:0,relatedTarget:function(e){return e.relatedTarget===void 0?e.fromElement===e.srcElement?e.toElement:e.fromElement:e.relatedTarget},movementX:function(e){return"movementX"in e?e.movementX:(e!==ur&&(ur&&e.type==="mousemove"?(_i=e.screenX-ur.screenX,Ci=e.screenY-ur.screenY):Ci=_i=0,ur=e),_i)},movementY:function(e){return"movementY"in e?e.movementY:Ci}}),Za=Qe(no),pd=ee({},no,{dataTransfer:0}),hd=Qe(pd),md=ee({},ar,{relatedTarget:0}),Ti=Qe(md),vd=ee({},Pt,{animationName:0,elapsedTime:0,pseudoElement:0}),gd=Qe(vd),yd=ee({},Pt,{clipboardData:function(e){return"clipboardData"in e?e.clipboardData:window.clipboardData}}),bd=Qe(yd),kd=ee({},Pt,{data:0}),Ga=Qe(kd),xd={Esc:"Escape",Spacebar:" ",Left:"ArrowLeft",Up:"ArrowUp",Right:"ArrowRight",Down:"ArrowDown",Del:"Delete",Win:"OS",Menu:"ContextMenu",Apps:"ContextMenu",Scroll:"ScrollLock",MozPrintableKey:"Unidentified"},wd={8:"Backspace",9:"Tab",12:"Clear",13:"Enter",16:"Shift",17:"Control",18:"Alt",19:"Pause",20:"CapsLock",27:"Escape",32:" ",33:"PageUp",34:"PageDown",35:"End",36:"Home",37:"ArrowLeft",38:"ArrowUp",39:"ArrowRight",40:"ArrowDown",45:"Insert",46:"Delete",112:"F1",113:"F2",114:"F3",115:"F4",116:"F5",117:"F6",118:"F7",119:"F8",120:"F9",121:"F10",122:"F11",123:"F12",144:"NumLock",145:"ScrollLock",224:"Meta"},Sd={Alt:"altKey",Control:"ctrlKey",Meta:"metaKey",Shift:"shiftKey"};function Pd(e){var n=this.nativeEvent;return n.getModifierState?n.getModifierState(e):(e=Sd[e])?!!n[e]:!1}function zi(){return Pd}var Od=ee({},ar,{key:function(e){if(e.key){var n=xd[e.key]||e.key;if(n!=="Unidentified")return n}return e.type==="keypress"?(e=Jr(e),e===13?"Enter":String.fromCharCode(e)):e.type==="keydown"||e.type==="keyup"?wd[e.keyCode]||"Unidentified":""},code:0,location:0,ctrlKey:0,shiftKey:0,altKey:0,metaKey:0,repeat:0,locale:0,getModifierState:zi,charCode:function(e){return e.type==="keypress"?Jr(e):0},keyCode:function(e){return e.type==="keydown"||e.type==="keyup"?e.keyCode:0},which:function(e){return e.type==="keypress"?Jr(e):e.type==="keydown"||e.type==="keyup"?e.keyCode:0}}),Ed=Qe(Od),_d=ee({},no,{pointerId:0,width:0,height:0,pressure:0,tangentialPressure:0,tiltX:0,tiltY:0,twist:0,pointerType:0,isPrimary:0}),Ja=Qe(_d),Cd=ee({},ar,{touches:0,targetTouches:0,changedTouches:0,altKey:0,metaKey:0,ctrlKey:0,shiftKey:0,getModifierState:zi}),Td=Qe(Cd),zd=ee({},Pt,{propertyName:0,elapsedTime:0,pseudoElement:0}),Dd=Qe(zd),Md=ee({},no,{deltaX:function(e){return"deltaX"in e?e.deltaX:"wheelDeltaX"in e?-e.wheelDeltaX:0},deltaY:function(e){return"deltaY"in e?e.deltaY:"wheelDeltaY"in e?-e.wheelDeltaY:"wheelDelta"in e?-e.wheelDelta:0},deltaZ:0,deltaMode:0}),Rd=Qe(Md),Nd=[9,13,27,32],Di=w&&"CompositionEvent"in window,sr=null;w&&"documentMode"in document&&(sr=document.documentMode);var Ad=w&&"TextEvent"in window&&!sr,eu=w&&(!Di||sr&&8<sr&&11>=sr),nu=" ",tu=!1;function ru(e,n){switch(e){case"keyup":return Nd.indexOf(n.keyCode)!==-1;case"keydown":return n.keyCode!==229;case"keypress":case"mousedown":case"focusout":return!0;default:return!1}}function ou(e){return e=e.detail,typeof e=="object"&&"data"in e?e.data:null}var Ot=!1;function Ld(e,n){switch(e){case"compositionend":return ou(n);case"keypress":return n.which!==32?null:(tu=!0,nu);case"textInput":return e=n.data,e===nu&&tu?null:e;default:return null}}function jd(e,n){if(Ot)return e==="compositionend"||!Di&&ru(e,n)?(e=Ka(),Gr=Oi=In=null,Ot=!1,e):null;switch(e){case"paste":return null;case"keypress":if(!(n.ctrlKey||n.altKey||n.metaKey)||n.ctrlKey&&n.altKey){if(n.char&&1<n.char.length)return n.char;if(n.which)return String.fromCharCode(n.which)}return null;case"compositionend":return eu&&n.locale!=="ko"?null:n.data;default:return null}}var Fd={color:!0,date:!0,datetime:!0,"datetime-local":!0,email:!0,month:!0,number:!0,password:!0,range:!0,search:!0,tel:!0,text:!0,time:!0,url:!0,week:!0};function iu(e){var n=e&&e.nodeName&&e.nodeName.toLowerCase();return n==="input"?!!Fd[e.type]:n==="textarea"}function lu(e,n,t,r){Ea(r),n=lo(n,"onChange"),0<n.length&&(t=new Ei("onChange","change",null,t,r),e.push({event:t,listeners:n}))}var cr=null,dr=null;function Id(e){Pu(e,0)}function to(e){var n=zt(e);if(ha(n))return e}function Hd(e,n){if(e==="change")return n}var au=!1;if(w){var Mi;if(w){var Ri="oninput"in document;if(!Ri){var uu=document.createElement("div");uu.setAttribute("oninput","return;"),Ri=typeof uu.oninput=="function"}Mi=Ri}else Mi=!1;au=Mi&&(!document.documentMode||9<document.documentMode)}function su(){cr&&(cr.detachEvent("onpropertychange",cu),dr=cr=null)}function cu(e){if(e.propertyName==="value"&&to(dr)){var n=[];lu(n,dr,e,fi(e)),za(Id,n)}}function Ud(e,n,t){e==="focusin"?(su(),cr=n,dr=t,cr.attachEvent("onpropertychange",cu)):e==="focusout"&&su()}function $d(e){if(e==="selectionchange"||e==="keyup"||e==="keydown")return to(dr)}function Bd(e,n){if(e==="click")return to(n)}function Vd(e,n){if(e==="input"||e==="change")return to(n)}function Wd(e,n){return e===n&&(e!==0||1/e===1/n)||e!==e&&n!==n}var an=typeof Object.is=="function"?Object.is:Wd;function fr(e,n){if(an(e,n))return!0;if(typeof e!="object"||e===null||typeof n!="object"||n===null)return!1;var t=Object.keys(e),r=Object.keys(n);if(t.length!==r.length)return!1;for(r=0;r<t.length;r++){var o=t[r];if(!x.call(n,o)||!an(e[o],n[o]))return!1}return!0}function du(e){for(;e&&e.firstChild;)e=e.firstChild;return e}function fu(e,n){var t=du(e);e=0;for(var r;t;){if(t.nodeType===3){if(r=e+t.textContent.length,e<=n&&r>=n)return{node:t,offset:n-e};e=r}e:{for(;t;){if(t.nextSibling){t=t.nextSibling;break e}t=t.parentNode}t=void 0}t=du(t)}}function pu(e,n){return e&&n?e===n?!0:e&&e.nodeType===3?!1:n&&n.nodeType===3?pu(e,n.parentNode):"contains"in e?e.contains(n):e.compareDocumentPosition?!!(e.compareDocumentPosition(n)&16):!1:!1}function hu(){for(var e=window,n=Ir();n instanceof e.HTMLIFrameElement;){try{var t=typeof n.contentWindow.location.href=="string"}catch{t=!1}if(t)e=n.contentWindow;else break;n=Ir(e.document)}return n}function Ni(e){var n=e&&e.nodeName&&e.nodeName.toLowerCase();return n&&(n==="input"&&(e.type==="text"||e.type==="search"||e.type==="tel"||e.type==="url"||e.type==="password")||n==="textarea"||e.contentEditable==="true")}function Qd(e){var n=hu(),t=e.focusedElem,r=e.selectionRange;if(n!==t&&t&&t.ownerDocument&&pu(t.ownerDocument.documentElement,t)){if(r!==null&&Ni(t)){if(n=r.start,e=r.end,e===void 0&&(e=n),"selectionStart"in t)t.selectionStart=n,t.selectionEnd=Math.min(e,t.value.length);else if(e=(n=t.ownerDocument||document)&&n.defaultView||window,e.getSelection){e=e.getSelection();var o=t.textContent.length,i=Math.min(r.start,o);r=r.end===void 0?i:Math.min(r.end,o),!e.extend&&i>r&&(o=r,r=i,i=o),o=fu(t,i);var u=fu(t,r);o&&u&&(e.rangeCount!==1||e.anchorNode!==o.node||e.anchorOffset!==o.offset||e.focusNode!==u.node||e.focusOffset!==u.offset)&&(n=n.createRange(),n.setStart(o.node,o.offset),e.removeAllRanges(),i>r?(e.addRange(n),e.extend(u.node,u.offset)):(n.setEnd(u.node,u.offset),e.addRange(n)))}}for(n=[],e=t;e=e.parentNode;)e.nodeType===1&&n.push({element:e,left:e.scrollLeft,top:e.scrollTop});for(typeof t.focus=="function"&&t.focus(),t=0;t<n.length;t++)e=n[t],e.element.scrollLeft=e.left,e.element.scrollTop=e.top}}var qd=w&&"documentMode"in document&&11>=document.documentMode,Et=null,Ai=null,pr=null,Li=!1;function mu(e,n,t){var r=t.window===t?t.document:t.nodeType===9?t:t.ownerDocument;Li||Et==null||Et!==Ir(r)||(r=Et,"selectionStart"in r&&Ni(r)?r={start:r.selectionStart,end:r.selectionEnd}:(r=(r.ownerDocument&&r.ownerDocument.defaultView||window).getSelection(),r={anchorNode:r.anchorNode,anchorOffset:r.anchorOffset,focusNode:r.focusNode,focusOffset:r.focusOffset}),pr&&fr(pr,r)||(pr=r,r=lo(Ai,"onSelect"),0<r.length&&(n=new Ei("onSelect","select",null,n,t),e.push({event:n,listeners:r}),n.target=Et)))}function ro(e,n){var t={};return t[e.toLowerCase()]=n.toLowerCase(),t["Webkit"+e]="webkit"+n,t["Moz"+e]="moz"+n,t}var _t={animationend:ro("Animation","AnimationEnd"),animationiteration:ro("Animation","AnimationIteration"),animationstart:ro("Animation","AnimationStart"),transitionend:ro("Transition","TransitionEnd")},ji={},vu={};w&&(vu=document.createElement("div").style,"AnimationEvent"in window||(delete _t.animationend.animation,delete _t.animationiteration.animation,delete _t.animationstart.animation),"TransitionEvent"in window||delete _t.transitionend.transition);function oo(e){if(ji[e])return ji[e];if(!_t[e])return e;var n=_t[e],t;for(t in n)if(n.hasOwnProperty(t)&&t in vu)return ji[e]=n[t];return e}var gu=oo("animationend"),yu=oo("animationiteration"),bu=oo("animationstart"),ku=oo("transitionend"),xu=new Map,wu="abort auxClick cancel canPlay canPlayThrough click close contextMenu copy cut drag dragEnd dragEnter dragExit dragLeave dragOver dragStart drop durationChange emptied encrypted ended error gotPointerCapture input invalid keyDown keyPress keyUp load loadedData loadedMetadata loadStart lostPointerCapture mouseDown mouseMove mouseOut mouseOver mouseUp paste pause play playing pointerCancel pointerDown pointerMove pointerOut pointerOver pointerUp progress rateChange reset resize seeked seeking stalled submit suspend timeUpdate touchCancel touchEnd touchStart volumeChange scroll toggle touchMove waiting wheel".split(" ");function Hn(e,n){xu.set(e,n),v(n,[e])}for(var Fi=0;Fi<wu.length;Fi++){var Ii=wu[Fi],Xd=Ii.toLowerCase(),Kd=Ii[0].toUpperCase()+Ii.slice(1);Hn(Xd,"on"+Kd)}Hn(gu,"onAnimationEnd"),Hn(yu,"onAnimationIteration"),Hn(bu,"onAnimationStart"),Hn("dblclick","onDoubleClick"),Hn("focusin","onFocus"),Hn("focusout","onBlur"),Hn(ku,"onTransitionEnd"),k("onMouseEnter",["mouseout","mouseover"]),k("onMouseLeave",["mouseout","mouseover"]),k("onPointerEnter",["pointerout","pointerover"]),k("onPointerLeave",["pointerout","pointerover"]),v("onChange","change click focusin focusout input keydown keyup selectionchange".split(" ")),v("onSelect","focusout contextmenu dragend focusin keydown keyup mousedown mouseup selectionchange".split(" ")),v("onBeforeInput",["compositionend","keypress","textInput","paste"]),v("onCompositionEnd","compositionend focusout keydown keypress keyup mousedown".split(" ")),v("onCompositionStart","compositionstart focusout keydown keypress keyup mousedown".split(" ")),v("onCompositionUpdate","compositionupdate focusout keydown keypress keyup mousedown".split(" "));var hr="abort canplay canplaythrough durationchange emptied encrypted ended error loadeddata loadedmetadata loadstart pause play playing progress ratechange resize seeked seeking stalled suspend timeupdate volumechange waiting".split(" "),Yd=new Set("cancel close invalid load scroll toggle".split(" ").concat(hr));function Su(e,n,t){var r=e.type||"unknown-event";e.currentTarget=t,Xc(r,n,void 0,e),e.currentTarget=null}function Pu(e,n){n=(n&4)!==0;for(var t=0;t<e.length;t++){var r=e[t],o=r.event;r=r.listeners;e:{var i=void 0;if(n)for(var u=r.length-1;0<=u;u--){var d=r[u],f=d.instance,b=d.currentTarget;if(d=d.listener,f!==i&&o.isPropagationStopped())break e;Su(o,d,b),i=f}else for(u=0;u<r.length;u++){if(d=r[u],f=d.instance,b=d.currentTarget,d=d.listener,f!==i&&o.isPropagationStopped())break e;Su(o,d,b),i=f}}}if($r)throw e=vi,$r=!1,vi=null,e}function te(e,n){var t=n[qi];t===void 0&&(t=n[qi]=new Set);var r=e+"__bubble";t.has(r)||(Ou(n,e,2,!1),t.add(r))}function Hi(e,n,t){var r=0;n&&(r|=4),Ou(t,e,r,n)}var io="_reactListening"+Math.random().toString(36).slice(2);function mr(e){if(!e[io]){e[io]=!0,c.forEach(function(t){t!=="selectionchange"&&(Yd.has(t)||Hi(t,!1,e),Hi(t,!0,e))});var n=e.nodeType===9?e:e.ownerDocument;n===null||n[io]||(n[io]=!0,Hi("selectionchange",!1,n))}}function Ou(e,n,t,r){switch(Xa(n)){case 1:var o=cd;break;case 4:o=dd;break;default:o=Si}t=o.bind(null,n,t,e),o=void 0,!mi||n!=="touchstart"&&n!=="touchmove"&&n!=="wheel"||(o=!0),r?o!==void 0?e.addEventListener(n,t,{capture:!0,passive:o}):e.addEventListener(n,t,!0):o!==void 0?e.addEventListener(n,t,{passive:o}):e.addEventListener(n,t,!1)}function Ui(e,n,t,r,o){var i=r;if((n&1)===0&&(n&2)===0&&r!==null)e:for(;;){if(r===null)return;var u=r.tag;if(u===3||u===4){var d=r.stateNode.containerInfo;if(d===o||d.nodeType===8&&d.parentNode===o)break;if(u===4)for(u=r.return;u!==null;){var f=u.tag;if((f===3||f===4)&&(f=u.stateNode.containerInfo,f===o||f.nodeType===8&&f.parentNode===o))return;u=u.return}for(;d!==null;){if(u=it(d),u===null)return;if(f=u.tag,f===5||f===6){r=i=u;continue e}d=d.parentNode}}r=r.return}za(function(){var b=i,P=fi(t),O=[];e:{var S=xu.get(e);if(S!==void 0){var z=Ei,M=e;switch(e){case"keypress":if(Jr(t)===0)break e;case"keydown":case"keyup":z=Ed;break;case"focusin":M="focus",z=Ti;break;case"focusout":M="blur",z=Ti;break;case"beforeblur":case"afterblur":z=Ti;break;case"click":if(t.button===2)break e;case"auxclick":case"dblclick":case"mousedown":case"mousemove":case"mouseup":case"mouseout":case"mouseover":case"contextmenu":z=Za;break;case"drag":case"dragend":case"dragenter":case"dragexit":case"dragleave":case"dragover":case"dragstart":case"drop":z=hd;break;case"touchcancel":case"touchend":case"touchmove":case"touchstart":z=Td;break;case gu:case yu:case bu:z=gd;break;case ku:z=Dd;break;case"scroll":z=fd;break;case"wheel":z=Rd;break;case"copy":case"cut":case"paste":z=bd;break;case"gotpointercapture":case"lostpointercapture":case"pointercancel":case"pointerdown":case"pointermove":case"pointerout":case"pointerover":case"pointerup":z=Ja}var R=(n&4)!==0,pe=!R&&e==="scroll",m=R?S!==null?S+"Capture":null:S;R=[];for(var p=b,g;p!==null;){g=p;var E=g.stateNode;if(g.tag===5&&E!==null&&(g=E,m!==null&&(E=Zt(p,m),E!=null&&R.push(vr(p,E,g)))),pe)break;p=p.return}0<R.length&&(S=new z(S,M,null,t,P),O.push({event:S,listeners:R}))}}if((n&7)===0){e:{if(S=e==="mouseover"||e==="pointerover",z=e==="mouseout"||e==="pointerout",S&&t!==di&&(M=t.relatedTarget||t.fromElement)&&(it(M)||M[Sn]))break e;if((z||S)&&(S=P.window===P?P:(S=P.ownerDocument)?S.defaultView||S.parentWindow:window,z?(M=t.relatedTarget||t.toElement,z=b,M=M?it(M):null,M!==null&&(pe=ot(M),M!==pe||M.tag!==5&&M.tag!==6)&&(M=null)):(z=null,M=b),z!==M)){if(R=Za,E="onMouseLeave",m="onMouseEnter",p="mouse",(e==="pointerout"||e==="pointerover")&&(R=Ja,E="onPointerLeave",m="onPointerEnter",p="pointer"),pe=z==null?S:zt(z),g=M==null?S:zt(M),S=new R(E,p+"leave",z,t,P),S.target=pe,S.relatedTarget=g,E=null,it(P)===b&&(R=new R(m,p+"enter",M,t,P),R.target=g,R.relatedTarget=pe,E=R),pe=E,z&&M)n:{for(R=z,m=M,p=0,g=R;g;g=Ct(g))p++;for(g=0,E=m;E;E=Ct(E))g++;for(;0<p-g;)R=Ct(R),p--;for(;0<g-p;)m=Ct(m),g--;for(;p--;){if(R===m||m!==null&&R===m.alternate)break n;R=Ct(R),m=Ct(m)}R=null}else R=null;z!==null&&Eu(O,S,z,R,!1),M!==null&&pe!==null&&Eu(O,pe,M,R,!0)}}e:{if(S=b?zt(b):window,z=S.nodeName&&S.nodeName.toLowerCase(),z==="select"||z==="input"&&S.type==="file")var N=Hd;else if(iu(S))if(au)N=Vd;else{N=$d;var F=Ud}else(z=S.nodeName)&&z.toLowerCase()==="input"&&(S.type==="checkbox"||S.type==="radio")&&(N=Bd);if(N&&(N=N(e,b))){lu(O,N,t,P);break e}F&&F(e,S,b),e==="focusout"&&(F=S._wrapperState)&&F.controlled&&S.type==="number"&&li(S,"number",S.value)}switch(F=b?zt(b):window,e){case"focusin":(iu(F)||F.contentEditable==="true")&&(Et=F,Ai=b,pr=null);break;case"focusout":pr=Ai=Et=null;break;case"mousedown":Li=!0;break;case"contextmenu":case"mouseup":case"dragend":Li=!1,mu(O,t,P);break;case"selectionchange":if(qd)break;case"keydown":case"keyup":mu(O,t,P)}var I;if(Di)e:{switch(e){case"compositionstart":var H="onCompositionStart";break e;case"compositionend":H="onCompositionEnd";break e;case"compositionupdate":H="onCompositionUpdate";break e}H=void 0}else Ot?ru(e,t)&&(H="onCompositionEnd"):e==="keydown"&&t.keyCode===229&&(H="onCompositionStart");H&&(eu&&t.locale!=="ko"&&(Ot||H!=="onCompositionStart"?H==="onCompositionEnd"&&Ot&&(I=Ka()):(In=P,Oi="value"in In?In.value:In.textContent,Ot=!0)),F=lo(b,H),0<F.length&&(H=new Ga(H,e,null,t,P),O.push({event:H,listeners:F}),I?H.data=I:(I=ou(t),I!==null&&(H.data=I)))),(I=Ad?Ld(e,t):jd(e,t))&&(b=lo(b,"onBeforeInput"),0<b.length&&(P=new Ga("onBeforeInput","beforeinput",null,t,P),O.push({event:P,listeners:b}),P.data=I))}Pu(O,n)})}function vr(e,n,t){return{instance:e,listener:n,currentTarget:t}}function lo(e,n){for(var t=n+"Capture",r=[];e!==null;){var o=e,i=o.stateNode;o.tag===5&&i!==null&&(o=i,i=Zt(e,t),i!=null&&r.unshift(vr(e,i,o)),i=Zt(e,n),i!=null&&r.push(vr(e,i,o))),e=e.return}return r}function Ct(e){if(e===null)return null;do e=e.return;while(e&&e.tag!==5);return e||null}function Eu(e,n,t,r,o){for(var i=n._reactName,u=[];t!==null&&t!==r;){var d=t,f=d.alternate,b=d.stateNode;if(f!==null&&f===r)break;d.tag===5&&b!==null&&(d=b,o?(f=Zt(t,i),f!=null&&u.unshift(vr(t,f,d))):o||(f=Zt(t,i),f!=null&&u.push(vr(t,f,d)))),t=t.return}u.length!==0&&e.push({event:n,listeners:u})}var Zd=/\r\n?/g,Gd=/\u0000|\uFFFD/g;function _u(e){return(typeof e=="string"?e:""+e).replace(Zd,`
`).replace(Gd,"")}function ao(e,n,t){if(n=_u(n),_u(e)!==n&&t)throw Error(a(425))}function uo(){}var $i=null,Bi=null;function Vi(e,n){return e==="textarea"||e==="noscript"||typeof n.children=="string"||typeof n.children=="number"||typeof n.dangerouslySetInnerHTML=="object"&&n.dangerouslySetInnerHTML!==null&&n.dangerouslySetInnerHTML.__html!=null}var Wi=typeof setTimeout=="function"?setTimeout:void 0,Jd=typeof clearTimeout=="function"?clearTimeout:void 0,Cu=typeof Promise=="function"?Promise:void 0,ef=typeof queueMicrotask=="function"?queueMicrotask:typeof Cu<"u"?function(e){return Cu.resolve(null).then(e).catch(nf)}:Wi;function nf(e){setTimeout(function(){throw e})}function Qi(e,n){var t=n,r=0;do{var o=t.nextSibling;if(e.removeChild(t),o&&o.nodeType===8)if(t=o.data,t==="/$"){if(r===0){e.removeChild(o),lr(n);return}r--}else t!=="$"&&t!=="$?"&&t!=="$!"||r++;t=o}while(t);lr(n)}function Un(e){for(;e!=null;e=e.nextSibling){var n=e.nodeType;if(n===1||n===3)break;if(n===8){if(n=e.data,n==="$"||n==="$!"||n==="$?")break;if(n==="/$")return null}}return e}function Tu(e){e=e.previousSibling;for(var n=0;e;){if(e.nodeType===8){var t=e.data;if(t==="$"||t==="$!"||t==="$?"){if(n===0)return e;n--}else t==="/$"&&n++}e=e.previousSibling}return null}var Tt=Math.random().toString(36).slice(2),yn="__reactFiber$"+Tt,gr="__reactProps$"+Tt,Sn="__reactContainer$"+Tt,qi="__reactEvents$"+Tt,tf="__reactListeners$"+Tt,rf="__reactHandles$"+Tt;function it(e){var n=e[yn];if(n)return n;for(var t=e.parentNode;t;){if(n=t[Sn]||t[yn]){if(t=n.alternate,n.child!==null||t!==null&&t.child!==null)for(e=Tu(e);e!==null;){if(t=e[yn])return t;e=Tu(e)}return n}e=t,t=e.parentNode}return null}function yr(e){return e=e[yn]||e[Sn],!e||e.tag!==5&&e.tag!==6&&e.tag!==13&&e.tag!==3?null:e}function zt(e){if(e.tag===5||e.tag===6)return e.stateNode;throw Error(a(33))}function so(e){return e[gr]||null}var Xi=[],Dt=-1;function $n(e){return{current:e}}function re(e){0>Dt||(e.current=Xi[Dt],Xi[Dt]=null,Dt--)}function ne(e,n){Dt++,Xi[Dt]=e.current,e.current=n}var Bn={},Re=$n(Bn),Ie=$n(!1),lt=Bn;function Mt(e,n){var t=e.type.contextTypes;if(!t)return Bn;var r=e.stateNode;if(r&&r.__reactInternalMemoizedUnmaskedChildContext===n)return r.__reactInternalMemoizedMaskedChildContext;var o={},i;for(i in t)o[i]=n[i];return r&&(e=e.stateNode,e.__reactInternalMemoizedUnmaskedChildContext=n,e.__reactInternalMemoizedMaskedChildContext=o),o}function He(e){return e=e.childContextTypes,e!=null}function co(){re(Ie),re(Re)}function zu(e,n,t){if(Re.current!==Bn)throw Error(a(168));ne(Re,n),ne(Ie,t)}function Du(e,n,t){var r=e.stateNode;if(n=n.childContextTypes,typeof r.getChildContext!="function")return t;r=r.getChildContext();for(var o in r)if(!(o in n))throw Error(a(108,de(e)||"Unknown",o));return ee({},t,r)}function fo(e){return e=(e=e.stateNode)&&e.__reactInternalMemoizedMergedChildContext||Bn,lt=Re.current,ne(Re,e),ne(Ie,Ie.current),!0}function Mu(e,n,t){var r=e.stateNode;if(!r)throw Error(a(169));t?(e=Du(e,n,lt),r.__reactInternalMemoizedMergedChildContext=e,re(Ie),re(Re),ne(Re,e)):re(Ie),ne(Ie,t)}var Pn=null,po=!1,Ki=!1;function Ru(e){Pn===null?Pn=[e]:Pn.push(e)}function of(e){po=!0,Ru(e)}function Vn(){if(!Ki&&Pn!==null){Ki=!0;var e=0,n=Z;try{var t=Pn;for(Z=1;e<t.length;e++){var r=t[e];do r=r(!0);while(r!==null)}Pn=null,po=!1}catch(o){throw Pn!==null&&(Pn=Pn.slice(e+1)),Aa(gi,Vn),o}finally{Z=n,Ki=!1}}return null}var Rt=[],Nt=0,ho=null,mo=0,Ge=[],Je=0,at=null,On=1,En="";function ut(e,n){Rt[Nt++]=mo,Rt[Nt++]=ho,ho=e,mo=n}function Nu(e,n,t){Ge[Je++]=On,Ge[Je++]=En,Ge[Je++]=at,at=e;var r=On;e=En;var o=32-ln(r)-1;r&=~(1<<o),t+=1;var i=32-ln(n)+o;if(30<i){var u=o-o%5;i=(r&(1<<u)-1).toString(32),r>>=u,o-=u,On=1<<32-ln(n)+o|t<<o|r,En=i+e}else On=1<<i|t<<o|r,En=e}function Yi(e){e.return!==null&&(ut(e,1),Nu(e,1,0))}function Zi(e){for(;e===ho;)ho=Rt[--Nt],Rt[Nt]=null,mo=Rt[--Nt],Rt[Nt]=null;for(;e===at;)at=Ge[--Je],Ge[Je]=null,En=Ge[--Je],Ge[Je]=null,On=Ge[--Je],Ge[Je]=null}var qe=null,Xe=null,le=!1,un=null;function Au(e,n){var t=rn(5,null,null,0);t.elementType="DELETED",t.stateNode=n,t.return=e,n=e.deletions,n===null?(e.deletions=[t],e.flags|=16):n.push(t)}function Lu(e,n){switch(e.tag){case 5:var t=e.type;return n=n.nodeType!==1||t.toLowerCase()!==n.nodeName.toLowerCase()?null:n,n!==null?(e.stateNode=n,qe=e,Xe=Un(n.firstChild),!0):!1;case 6:return n=e.pendingProps===""||n.nodeType!==3?null:n,n!==null?(e.stateNode=n,qe=e,Xe=null,!0):!1;case 13:return n=n.nodeType!==8?null:n,n!==null?(t=at!==null?{id:On,overflow:En}:null,e.memoizedState={dehydrated:n,treeContext:t,retryLane:1073741824},t=rn(18,null,null,0),t.stateNode=n,t.return=e,e.child=t,qe=e,Xe=null,!0):!1;default:return!1}}function Gi(e){return(e.mode&1)!==0&&(e.flags&128)===0}function Ji(e){if(le){var n=Xe;if(n){var t=n;if(!Lu(e,n)){if(Gi(e))throw Error(a(418));n=Un(t.nextSibling);var r=qe;n&&Lu(e,n)?Au(r,t):(e.flags=e.flags&-4097|2,le=!1,qe=e)}}else{if(Gi(e))throw Error(a(418));e.flags=e.flags&-4097|2,le=!1,qe=e}}}function ju(e){for(e=e.return;e!==null&&e.tag!==5&&e.tag!==3&&e.tag!==13;)e=e.return;qe=e}function vo(e){if(e!==qe)return!1;if(!le)return ju(e),le=!0,!1;var n;if((n=e.tag!==3)&&!(n=e.tag!==5)&&(n=e.type,n=n!=="head"&&n!=="body"&&!Vi(e.type,e.memoizedProps)),n&&(n=Xe)){if(Gi(e))throw Fu(),Error(a(418));for(;n;)Au(e,n),n=Un(n.nextSibling)}if(ju(e),e.tag===13){if(e=e.memoizedState,e=e!==null?e.dehydrated:null,!e)throw Error(a(317));e:{for(e=e.nextSibling,n=0;e;){if(e.nodeType===8){var t=e.data;if(t==="/$"){if(n===0){Xe=Un(e.nextSibling);break e}n--}else t!=="$"&&t!=="$!"&&t!=="$?"||n++}e=e.nextSibling}Xe=null}}else Xe=qe?Un(e.stateNode.nextSibling):null;return!0}function Fu(){for(var e=Xe;e;)e=Un(e.nextSibling)}function At(){Xe=qe=null,le=!1}function el(e){un===null?un=[e]:un.push(e)}var lf=he.ReactCurrentBatchConfig;function br(e,n,t){if(e=t.ref,e!==null&&typeof e!="function"&&typeof e!="object"){if(t._owner){if(t=t._owner,t){if(t.tag!==1)throw Error(a(309));var r=t.stateNode}if(!r)throw Error(a(147,e));var o=r,i=""+e;return n!==null&&n.ref!==null&&typeof n.ref=="function"&&n.ref._stringRef===i?n.ref:(n=function(u){var d=o.refs;u===null?delete d[i]:d[i]=u},n._stringRef=i,n)}if(typeof e!="string")throw Error(a(284));if(!t._owner)throw Error(a(290,e))}return e}function go(e,n){throw e=Object.prototype.toString.call(n),Error(a(31,e==="[object Object]"?"object with keys {"+Object.keys(n).join(", ")+"}":e))}function Iu(e){var n=e._init;return n(e._payload)}function Hu(e){function n(m,p){if(e){var g=m.deletions;g===null?(m.deletions=[p],m.flags|=16):g.push(p)}}function t(m,p){if(!e)return null;for(;p!==null;)n(m,p),p=p.sibling;return null}function r(m,p){for(m=new Map;p!==null;)p.key!==null?m.set(p.key,p):m.set(p.index,p),p=p.sibling;return m}function o(m,p){return m=Gn(m,p),m.index=0,m.sibling=null,m}function i(m,p,g){return m.index=g,e?(g=m.alternate,g!==null?(g=g.index,g<p?(m.flags|=2,p):g):(m.flags|=2,p)):(m.flags|=1048576,p)}function u(m){return e&&m.alternate===null&&(m.flags|=2),m}function d(m,p,g,E){return p===null||p.tag!==6?(p=Wl(g,m.mode,E),p.return=m,p):(p=o(p,g),p.return=m,p)}function f(m,p,g,E){var N=g.type;return N===Ee?P(m,p,g.props.children,E,g.key):p!==null&&(p.elementType===N||typeof N=="object"&&N!==null&&N.$$typeof===vn&&Iu(N)===p.type)?(E=o(p,g.props),E.ref=br(m,p,g),E.return=m,E):(E=Uo(g.type,g.key,g.props,null,m.mode,E),E.ref=br(m,p,g),E.return=m,E)}function b(m,p,g,E){return p===null||p.tag!==4||p.stateNode.containerInfo!==g.containerInfo||p.stateNode.implementation!==g.implementation?(p=Ql(g,m.mode,E),p.return=m,p):(p=o(p,g.children||[]),p.return=m,p)}function P(m,p,g,E,N){return p===null||p.tag!==7?(p=vt(g,m.mode,E,N),p.return=m,p):(p=o(p,g),p.return=m,p)}function O(m,p,g){if(typeof p=="string"&&p!==""||typeof p=="number")return p=Wl(""+p,m.mode,g),p.return=m,p;if(typeof p=="object"&&p!==null){switch(p.$$typeof){case Me:return g=Uo(p.type,p.key,p.props,null,m.mode,g),g.ref=br(m,null,p),g.return=m,g;case ke:return p=Ql(p,m.mode,g),p.return=m,p;case vn:var E=p._init;return O(m,E(p._payload),g)}if(Xt(p)||rt(p))return p=vt(p,m.mode,g,null),p.return=m,p;go(m,p)}return null}function S(m,p,g,E){var N=p!==null?p.key:null;if(typeof g=="string"&&g!==""||typeof g=="number")return N!==null?null:d(m,p,""+g,E);if(typeof g=="object"&&g!==null){switch(g.$$typeof){case Me:return g.key===N?f(m,p,g,E):null;case ke:return g.key===N?b(m,p,g,E):null;case vn:return N=g._init,S(m,p,N(g._payload),E)}if(Xt(g)||rt(g))return N!==null?null:P(m,p,g,E,null);go(m,g)}return null}function z(m,p,g,E,N){if(typeof E=="string"&&E!==""||typeof E=="number")return m=m.get(g)||null,d(p,m,""+E,N);if(typeof E=="object"&&E!==null){switch(E.$$typeof){case Me:return m=m.get(E.key===null?g:E.key)||null,f(p,m,E,N);case ke:return m=m.get(E.key===null?g:E.key)||null,b(p,m,E,N);case vn:var F=E._init;return z(m,p,g,F(E._payload),N)}if(Xt(E)||rt(E))return m=m.get(g)||null,P(p,m,E,N,null);go(p,E)}return null}function M(m,p,g,E){for(var N=null,F=null,I=p,H=p=0,Pe=null;I!==null&&H<g.length;H++){I.index>H?(Pe=I,I=null):Pe=I.sibling;var q=S(m,I,g[H],E);if(q===null){I===null&&(I=Pe);break}e&&I&&q.alternate===null&&n(m,I),p=i(q,p,H),F===null?N=q:F.sibling=q,F=q,I=Pe}if(H===g.length)return t(m,I),le&&ut(m,H),N;if(I===null){for(;H<g.length;H++)I=O(m,g[H],E),I!==null&&(p=i(I,p,H),F===null?N=I:F.sibling=I,F=I);return le&&ut(m,H),N}for(I=r(m,I);H<g.length;H++)Pe=z(I,m,H,g[H],E),Pe!==null&&(e&&Pe.alternate!==null&&I.delete(Pe.key===null?H:Pe.key),p=i(Pe,p,H),F===null?N=Pe:F.sibling=Pe,F=Pe);return e&&I.forEach(function(Jn){return n(m,Jn)}),le&&ut(m,H),N}function R(m,p,g,E){var N=rt(g);if(typeof N!="function")throw Error(a(150));if(g=N.call(g),g==null)throw Error(a(151));for(var F=N=null,I=p,H=p=0,Pe=null,q=g.next();I!==null&&!q.done;H++,q=g.next()){I.index>H?(Pe=I,I=null):Pe=I.sibling;var Jn=S(m,I,q.value,E);if(Jn===null){I===null&&(I=Pe);break}e&&I&&Jn.alternate===null&&n(m,I),p=i(Jn,p,H),F===null?N=Jn:F.sibling=Jn,F=Jn,I=Pe}if(q.done)return t(m,I),le&&ut(m,H),N;if(I===null){for(;!q.done;H++,q=g.next())q=O(m,q.value,E),q!==null&&(p=i(q,p,H),F===null?N=q:F.sibling=q,F=q);return le&&ut(m,H),N}for(I=r(m,I);!q.done;H++,q=g.next())q=z(I,m,H,q.value,E),q!==null&&(e&&q.alternate!==null&&I.delete(q.key===null?H:q.key),p=i(q,p,H),F===null?N=q:F.sibling=q,F=q);return e&&I.forEach(function(If){return n(m,If)}),le&&ut(m,H),N}function pe(m,p,g,E){if(typeof g=="object"&&g!==null&&g.type===Ee&&g.key===null&&(g=g.props.children),typeof g=="object"&&g!==null){switch(g.$$typeof){case Me:e:{for(var N=g.key,F=p;F!==null;){if(F.key===N){if(N=g.type,N===Ee){if(F.tag===7){t(m,F.sibling),p=o(F,g.props.children),p.return=m,m=p;break e}}else if(F.elementType===N||typeof N=="object"&&N!==null&&N.$$typeof===vn&&Iu(N)===F.type){t(m,F.sibling),p=o(F,g.props),p.ref=br(m,F,g),p.return=m,m=p;break e}t(m,F);break}else n(m,F);F=F.sibling}g.type===Ee?(p=vt(g.props.children,m.mode,E,g.key),p.return=m,m=p):(E=Uo(g.type,g.key,g.props,null,m.mode,E),E.ref=br(m,p,g),E.return=m,m=E)}return u(m);case ke:e:{for(F=g.key;p!==null;){if(p.key===F)if(p.tag===4&&p.stateNode.containerInfo===g.containerInfo&&p.stateNode.implementation===g.implementation){t(m,p.sibling),p=o(p,g.children||[]),p.return=m,m=p;break e}else{t(m,p);break}else n(m,p);p=p.sibling}p=Ql(g,m.mode,E),p.return=m,m=p}return u(m);case vn:return F=g._init,pe(m,p,F(g._payload),E)}if(Xt(g))return M(m,p,g,E);if(rt(g))return R(m,p,g,E);go(m,g)}return typeof g=="string"&&g!==""||typeof g=="number"?(g=""+g,p!==null&&p.tag===6?(t(m,p.sibling),p=o(p,g),p.return=m,m=p):(t(m,p),p=Wl(g,m.mode,E),p.return=m,m=p),u(m)):t(m,p)}return pe}var Lt=Hu(!0),Uu=Hu(!1),yo=$n(null),bo=null,jt=null,nl=null;function tl(){nl=jt=bo=null}function rl(e){var n=yo.current;re(yo),e._currentValue=n}function ol(e,n,t){for(;e!==null;){var r=e.alternate;if((e.childLanes&n)!==n?(e.childLanes|=n,r!==null&&(r.childLanes|=n)):r!==null&&(r.childLanes&n)!==n&&(r.childLanes|=n),e===t)break;e=e.return}}function Ft(e,n){bo=e,nl=jt=null,e=e.dependencies,e!==null&&e.firstContext!==null&&((e.lanes&n)!==0&&(Ue=!0),e.firstContext=null)}function en(e){var n=e._currentValue;if(nl!==e)if(e={context:e,memoizedValue:n,next:null},jt===null){if(bo===null)throw Error(a(308));jt=e,bo.dependencies={lanes:0,firstContext:e}}else jt=jt.next=e;return n}var st=null;function il(e){st===null?st=[e]:st.push(e)}function $u(e,n,t,r){var o=n.interleaved;return o===null?(t.next=t,il(n)):(t.next=o.next,o.next=t),n.interleaved=t,_n(e,r)}function _n(e,n){e.lanes|=n;var t=e.alternate;for(t!==null&&(t.lanes|=n),t=e,e=e.return;e!==null;)e.childLanes|=n,t=e.alternate,t!==null&&(t.childLanes|=n),t=e,e=e.return;return t.tag===3?t.stateNode:null}var Wn=!1;function ll(e){e.updateQueue={baseState:e.memoizedState,firstBaseUpdate:null,lastBaseUpdate:null,shared:{pending:null,interleaved:null,lanes:0},effects:null}}function Bu(e,n){e=e.updateQueue,n.updateQueue===e&&(n.updateQueue={baseState:e.baseState,firstBaseUpdate:e.firstBaseUpdate,lastBaseUpdate:e.lastBaseUpdate,shared:e.shared,effects:e.effects})}function Cn(e,n){return{eventTime:e,lane:n,tag:0,payload:null,callback:null,next:null}}function Qn(e,n,t){var r=e.updateQueue;if(r===null)return null;if(r=r.shared,(Q&2)!==0){var o=r.pending;return o===null?n.next=n:(n.next=o.next,o.next=n),r.pending=n,_n(e,t)}return o=r.interleaved,o===null?(n.next=n,il(r)):(n.next=o.next,o.next=n),r.interleaved=n,_n(e,t)}function ko(e,n,t){if(n=n.updateQueue,n!==null&&(n=n.shared,(t&4194240)!==0)){var r=n.lanes;r&=e.pendingLanes,t|=r,n.lanes=t,ki(e,t)}}function Vu(e,n){var t=e.updateQueue,r=e.alternate;if(r!==null&&(r=r.updateQueue,t===r)){var o=null,i=null;if(t=t.firstBaseUpdate,t!==null){do{var u={eventTime:t.eventTime,lane:t.lane,tag:t.tag,payload:t.payload,callback:t.callback,next:null};i===null?o=i=u:i=i.next=u,t=t.next}while(t!==null);i===null?o=i=n:i=i.next=n}else o=i=n;t={baseState:r.baseState,firstBaseUpdate:o,lastBaseUpdate:i,shared:r.shared,effects:r.effects},e.updateQueue=t;return}e=t.lastBaseUpdate,e===null?t.firstBaseUpdate=n:e.next=n,t.lastBaseUpdate=n}function xo(e,n,t,r){var o=e.updateQueue;Wn=!1;var i=o.firstBaseUpdate,u=o.lastBaseUpdate,d=o.shared.pending;if(d!==null){o.shared.pending=null;var f=d,b=f.next;f.next=null,u===null?i=b:u.next=b,u=f;var P=e.alternate;P!==null&&(P=P.updateQueue,d=P.lastBaseUpdate,d!==u&&(d===null?P.firstBaseUpdate=b:d.next=b,P.lastBaseUpdate=f))}if(i!==null){var O=o.baseState;u=0,P=b=f=null,d=i;do{var S=d.lane,z=d.eventTime;if((r&S)===S){P!==null&&(P=P.next={eventTime:z,lane:0,tag:d.tag,payload:d.payload,callback:d.callback,next:null});e:{var M=e,R=d;switch(S=n,z=t,R.tag){case 1:if(M=R.payload,typeof M=="function"){O=M.call(z,O,S);break e}O=M;break e;case 3:M.flags=M.flags&-65537|128;case 0:if(M=R.payload,S=typeof M=="function"?M.call(z,O,S):M,S==null)break e;O=ee({},O,S);break e;case 2:Wn=!0}}d.callback!==null&&d.lane!==0&&(e.flags|=64,S=o.effects,S===null?o.effects=[d]:S.push(d))}else z={eventTime:z,lane:S,tag:d.tag,payload:d.payload,callback:d.callback,next:null},P===null?(b=P=z,f=O):P=P.next=z,u|=S;if(d=d.next,d===null){if(d=o.shared.pending,d===null)break;S=d,d=S.next,S.next=null,o.lastBaseUpdate=S,o.shared.pending=null}}while(!0);if(P===null&&(f=O),o.baseState=f,o.firstBaseUpdate=b,o.lastBaseUpdate=P,n=o.shared.interleaved,n!==null){o=n;do u|=o.lane,o=o.next;while(o!==n)}else i===null&&(o.shared.lanes=0);ft|=u,e.lanes=u,e.memoizedState=O}}function Wu(e,n,t){if(e=n.effects,n.effects=null,e!==null)for(n=0;n<e.length;n++){var r=e[n],o=r.callback;if(o!==null){if(r.callback=null,r=t,typeof o!="function")throw Error(a(191,o));o.call(r)}}}var kr={},bn=$n(kr),xr=$n(kr),wr=$n(kr);function ct(e){if(e===kr)throw Error(a(174));return e}function al(e,n){switch(ne(wr,n),ne(xr,e),ne(bn,kr),e=n.nodeType,e){case 9:case 11:n=(n=n.documentElement)?n.namespaceURI:ui(null,"");break;default:e=e===8?n.parentNode:n,n=e.namespaceURI||null,e=e.tagName,n=ui(n,e)}re(bn),ne(bn,n)}function It(){re(bn),re(xr),re(wr)}function Qu(e){ct(wr.current);var n=ct(bn.current),t=ui(n,e.type);n!==t&&(ne(xr,e),ne(bn,t))}function ul(e){xr.current===e&&(re(bn),re(xr))}var ue=$n(0);function wo(e){for(var n=e;n!==null;){if(n.tag===13){var t=n.memoizedState;if(t!==null&&(t=t.dehydrated,t===null||t.data==="$?"||t.data==="$!"))return n}else if(n.tag===19&&n.memoizedProps.revealOrder!==void 0){if((n.flags&128)!==0)return n}else if(n.child!==null){n.child.return=n,n=n.child;continue}if(n===e)break;for(;n.sibling===null;){if(n.return===null||n.return===e)return null;n=n.return}n.sibling.return=n.return,n=n.sibling}return null}var sl=[];function cl(){for(var e=0;e<sl.length;e++)sl[e]._workInProgressVersionPrimary=null;sl.length=0}var So=he.ReactCurrentDispatcher,dl=he.ReactCurrentBatchConfig,dt=0,se=null,ve=null,we=null,Po=!1,Sr=!1,Pr=0,af=0;function Ne(){throw Error(a(321))}function fl(e,n){if(n===null)return!1;for(var t=0;t<n.length&&t<e.length;t++)if(!an(e[t],n[t]))return!1;return!0}function pl(e,n,t,r,o,i){if(dt=i,se=n,n.memoizedState=null,n.updateQueue=null,n.lanes=0,So.current=e===null||e.memoizedState===null?df:ff,e=t(r,o),Sr){i=0;do{if(Sr=!1,Pr=0,25<=i)throw Error(a(301));i+=1,we=ve=null,n.updateQueue=null,So.current=pf,e=t(r,o)}while(Sr)}if(So.current=_o,n=ve!==null&&ve.next!==null,dt=0,we=ve=se=null,Po=!1,n)throw Error(a(300));return e}function hl(){var e=Pr!==0;return Pr=0,e}function kn(){var e={memoizedState:null,baseState:null,baseQueue:null,queue:null,next:null};return we===null?se.memoizedState=we=e:we=we.next=e,we}function nn(){if(ve===null){var e=se.alternate;e=e!==null?e.memoizedState:null}else e=ve.next;var n=we===null?se.memoizedState:we.next;if(n!==null)we=n,ve=e;else{if(e===null)throw Error(a(310));ve=e,e={memoizedState:ve.memoizedState,baseState:ve.baseState,baseQueue:ve.baseQueue,queue:ve.queue,next:null},we===null?se.memoizedState=we=e:we=we.next=e}return we}function Or(e,n){return typeof n=="function"?n(e):n}function ml(e){var n=nn(),t=n.queue;if(t===null)throw Error(a(311));t.lastRenderedReducer=e;var r=ve,o=r.baseQueue,i=t.pending;if(i!==null){if(o!==null){var u=o.next;o.next=i.next,i.next=u}r.baseQueue=o=i,t.pending=null}if(o!==null){i=o.next,r=r.baseState;var d=u=null,f=null,b=i;do{var P=b.lane;if((dt&P)===P)f!==null&&(f=f.next={lane:0,action:b.action,hasEagerState:b.hasEagerState,eagerState:b.eagerState,next:null}),r=b.hasEagerState?b.eagerState:e(r,b.action);else{var O={lane:P,action:b.action,hasEagerState:b.hasEagerState,eagerState:b.eagerState,next:null};f===null?(d=f=O,u=r):f=f.next=O,se.lanes|=P,ft|=P}b=b.next}while(b!==null&&b!==i);f===null?u=r:f.next=d,an(r,n.memoizedState)||(Ue=!0),n.memoizedState=r,n.baseState=u,n.baseQueue=f,t.lastRenderedState=r}if(e=t.interleaved,e!==null){o=e;do i=o.lane,se.lanes|=i,ft|=i,o=o.next;while(o!==e)}else o===null&&(t.lanes=0);return[n.memoizedState,t.dispatch]}function vl(e){var n=nn(),t=n.queue;if(t===null)throw Error(a(311));t.lastRenderedReducer=e;var r=t.dispatch,o=t.pending,i=n.memoizedState;if(o!==null){t.pending=null;var u=o=o.next;do i=e(i,u.action),u=u.next;while(u!==o);an(i,n.memoizedState)||(Ue=!0),n.memoizedState=i,n.baseQueue===null&&(n.baseState=i),t.lastRenderedState=i}return[i,r]}function qu(){}function Xu(e,n){var t=se,r=nn(),o=n(),i=!an(r.memoizedState,o);if(i&&(r.memoizedState=o,Ue=!0),r=r.queue,gl(Zu.bind(null,t,r,e),[e]),r.getSnapshot!==n||i||we!==null&&we.memoizedState.tag&1){if(t.flags|=2048,Er(9,Yu.bind(null,t,r,o,n),void 0,null),Se===null)throw Error(a(349));(dt&30)!==0||Ku(t,n,o)}return o}function Ku(e,n,t){e.flags|=16384,e={getSnapshot:n,value:t},n=se.updateQueue,n===null?(n={lastEffect:null,stores:null},se.updateQueue=n,n.stores=[e]):(t=n.stores,t===null?n.stores=[e]:t.push(e))}function Yu(e,n,t,r){n.value=t,n.getSnapshot=r,Gu(n)&&Ju(e)}function Zu(e,n,t){return t(function(){Gu(n)&&Ju(e)})}function Gu(e){var n=e.getSnapshot;e=e.value;try{var t=n();return!an(e,t)}catch{return!0}}function Ju(e){var n=_n(e,1);n!==null&&fn(n,e,1,-1)}function es(e){var n=kn();return typeof e=="function"&&(e=e()),n.memoizedState=n.baseState=e,e={pending:null,interleaved:null,lanes:0,dispatch:null,lastRenderedReducer:Or,lastRenderedState:e},n.queue=e,e=e.dispatch=cf.bind(null,se,e),[n.memoizedState,e]}function Er(e,n,t,r){return e={tag:e,create:n,destroy:t,deps:r,next:null},n=se.updateQueue,n===null?(n={lastEffect:null,stores:null},se.updateQueue=n,n.lastEffect=e.next=e):(t=n.lastEffect,t===null?n.lastEffect=e.next=e:(r=t.next,t.next=e,e.next=r,n.lastEffect=e)),e}function ns(){return nn().memoizedState}function Oo(e,n,t,r){var o=kn();se.flags|=e,o.memoizedState=Er(1|n,t,void 0,r===void 0?null:r)}function Eo(e,n,t,r){var o=nn();r=r===void 0?null:r;var i=void 0;if(ve!==null){var u=ve.memoizedState;if(i=u.destroy,r!==null&&fl(r,u.deps)){o.memoizedState=Er(n,t,i,r);return}}se.flags|=e,o.memoizedState=Er(1|n,t,i,r)}function ts(e,n){return Oo(8390656,8,e,n)}function gl(e,n){return Eo(2048,8,e,n)}function rs(e,n){return Eo(4,2,e,n)}function os(e,n){return Eo(4,4,e,n)}function is(e,n){if(typeof n=="function")return e=e(),n(e),function(){n(null)};if(n!=null)return e=e(),n.current=e,function(){n.current=null}}function ls(e,n,t){return t=t!=null?t.concat([e]):null,Eo(4,4,is.bind(null,n,e),t)}function yl(){}function as(e,n){var t=nn();n=n===void 0?null:n;var r=t.memoizedState;return r!==null&&n!==null&&fl(n,r[1])?r[0]:(t.memoizedState=[e,n],e)}function us(e,n){var t=nn();n=n===void 0?null:n;var r=t.memoizedState;return r!==null&&n!==null&&fl(n,r[1])?r[0]:(e=e(),t.memoizedState=[e,n],e)}function ss(e,n,t){return(dt&21)===0?(e.baseState&&(e.baseState=!1,Ue=!0),e.memoizedState=t):(an(t,n)||(t=Ia(),se.lanes|=t,ft|=t,e.baseState=!0),n)}function uf(e,n){var t=Z;Z=t!==0&&4>t?t:4,e(!0);var r=dl.transition;dl.transition={};try{e(!1),n()}finally{Z=t,dl.transition=r}}function cs(){return nn().memoizedState}function sf(e,n,t){var r=Yn(e);if(t={lane:r,action:t,hasEagerState:!1,eagerState:null,next:null},ds(e))fs(n,t);else if(t=$u(e,n,t,r),t!==null){var o=Fe();fn(t,e,r,o),ps(t,n,r)}}function cf(e,n,t){var r=Yn(e),o={lane:r,action:t,hasEagerState:!1,eagerState:null,next:null};if(ds(e))fs(n,o);else{var i=e.alternate;if(e.lanes===0&&(i===null||i.lanes===0)&&(i=n.lastRenderedReducer,i!==null))try{var u=n.lastRenderedState,d=i(u,t);if(o.hasEagerState=!0,o.eagerState=d,an(d,u)){var f=n.interleaved;f===null?(o.next=o,il(n)):(o.next=f.next,f.next=o),n.interleaved=o;return}}catch{}finally{}t=$u(e,n,o,r),t!==null&&(o=Fe(),fn(t,e,r,o),ps(t,n,r))}}function ds(e){var n=e.alternate;return e===se||n!==null&&n===se}function fs(e,n){Sr=Po=!0;var t=e.pending;t===null?n.next=n:(n.next=t.next,t.next=n),e.pending=n}function ps(e,n,t){if((t&4194240)!==0){var r=n.lanes;r&=e.pendingLanes,t|=r,n.lanes=t,ki(e,t)}}var _o={readContext:en,useCallback:Ne,useContext:Ne,useEffect:Ne,useImperativeHandle:Ne,useInsertionEffect:Ne,useLayoutEffect:Ne,useMemo:Ne,useReducer:Ne,useRef:Ne,useState:Ne,useDebugValue:Ne,useDeferredValue:Ne,useTransition:Ne,useMutableSource:Ne,useSyncExternalStore:Ne,useId:Ne,unstable_isNewReconciler:!1},df={readContext:en,useCallback:function(e,n){return kn().memoizedState=[e,n===void 0?null:n],e},useContext:en,useEffect:ts,useImperativeHandle:function(e,n,t){return t=t!=null?t.concat([e]):null,Oo(4194308,4,is.bind(null,n,e),t)},useLayoutEffect:function(e,n){return Oo(4194308,4,e,n)},useInsertionEffect:function(e,n){return Oo(4,2,e,n)},useMemo:function(e,n){var t=kn();return n=n===void 0?null:n,e=e(),t.memoizedState=[e,n],e},useReducer:function(e,n,t){var r=kn();return n=t!==void 0?t(n):n,r.memoizedState=r.baseState=n,e={pending:null,interleaved:null,lanes:0,dispatch:null,lastRenderedReducer:e,lastRenderedState:n},r.queue=e,e=e.dispatch=sf.bind(null,se,e),[r.memoizedState,e]},useRef:function(e){var n=kn();return e={current:e},n.memoizedState=e},useState:es,useDebugValue:yl,useDeferredValue:function(e){return kn().memoizedState=e},useTransition:function(){var e=es(!1),n=e[0];return e=uf.bind(null,e[1]),kn().memoizedState=e,[n,e]},useMutableSource:function(){},useSyncExternalStore:function(e,n,t){var r=se,o=kn();if(le){if(t===void 0)throw Error(a(407));t=t()}else{if(t=n(),Se===null)throw Error(a(349));(dt&30)!==0||Ku(r,n,t)}o.memoizedState=t;var i={value:t,getSnapshot:n};return o.queue=i,ts(Zu.bind(null,r,i,e),[e]),r.flags|=2048,Er(9,Yu.bind(null,r,i,t,n),void 0,null),t},useId:function(){var e=kn(),n=Se.identifierPrefix;if(le){var t=En,r=On;t=(r&~(1<<32-ln(r)-1)).toString(32)+t,n=":"+n+"R"+t,t=Pr++,0<t&&(n+="H"+t.toString(32)),n+=":"}else t=af++,n=":"+n+"r"+t.toString(32)+":";return e.memoizedState=n},unstable_isNewReconciler:!1},ff={readContext:en,useCallback:as,useContext:en,useEffect:gl,useImperativeHandle:ls,useInsertionEffect:rs,useLayoutEffect:os,useMemo:us,useReducer:ml,useRef:ns,useState:function(){return ml(Or)},useDebugValue:yl,useDeferredValue:function(e){var n=nn();return ss(n,ve.memoizedState,e)},useTransition:function(){var e=ml(Or)[0],n=nn().memoizedState;return[e,n]},useMutableSource:qu,useSyncExternalStore:Xu,useId:cs,unstable_isNewReconciler:!1},pf={readContext:en,useCallback:as,useContext:en,useEffect:gl,useImperativeHandle:ls,useInsertionEffect:rs,useLayoutEffect:os,useMemo:us,useReducer:vl,useRef:ns,useState:function(){return vl(Or)},useDebugValue:yl,useDeferredValue:function(e){var n=nn();return ve===null?n.memoizedState=e:ss(n,ve.memoizedState,e)},useTransition:function(){var e=vl(Or)[0],n=nn().memoizedState;return[e,n]},useMutableSource:qu,useSyncExternalStore:Xu,useId:cs,unstable_isNewReconciler:!1};function sn(e,n){if(e&&e.defaultProps){n=ee({},n),e=e.defaultProps;for(var t in e)n[t]===void 0&&(n[t]=e[t]);return n}return n}function bl(e,n,t,r){n=e.memoizedState,t=t(r,n),t=t==null?n:ee({},n,t),e.memoizedState=t,e.lanes===0&&(e.updateQueue.baseState=t)}var Co={isMounted:function(e){return(e=e._reactInternals)?ot(e)===e:!1},enqueueSetState:function(e,n,t){e=e._reactInternals;var r=Fe(),o=Yn(e),i=Cn(r,o);i.payload=n,t!=null&&(i.callback=t),n=Qn(e,i,o),n!==null&&(fn(n,e,o,r),ko(n,e,o))},enqueueReplaceState:function(e,n,t){e=e._reactInternals;var r=Fe(),o=Yn(e),i=Cn(r,o);i.tag=1,i.payload=n,t!=null&&(i.callback=t),n=Qn(e,i,o),n!==null&&(fn(n,e,o,r),ko(n,e,o))},enqueueForceUpdate:function(e,n){e=e._reactInternals;var t=Fe(),r=Yn(e),o=Cn(t,r);o.tag=2,n!=null&&(o.callback=n),n=Qn(e,o,r),n!==null&&(fn(n,e,r,t),ko(n,e,r))}};function hs(e,n,t,r,o,i,u){return e=e.stateNode,typeof e.shouldComponentUpdate=="function"?e.shouldComponentUpdate(r,i,u):n.prototype&&n.prototype.isPureReactComponent?!fr(t,r)||!fr(o,i):!0}function ms(e,n,t){var r=!1,o=Bn,i=n.contextType;return typeof i=="object"&&i!==null?i=en(i):(o=He(n)?lt:Re.current,r=n.contextTypes,i=(r=r!=null)?Mt(e,o):Bn),n=new n(t,i),e.memoizedState=n.state!==null&&n.state!==void 0?n.state:null,n.updater=Co,e.stateNode=n,n._reactInternals=e,r&&(e=e.stateNode,e.__reactInternalMemoizedUnmaskedChildContext=o,e.__reactInternalMemoizedMaskedChildContext=i),n}function vs(e,n,t,r){e=n.state,typeof n.componentWillReceiveProps=="function"&&n.componentWillReceiveProps(t,r),typeof n.UNSAFE_componentWillReceiveProps=="function"&&n.UNSAFE_componentWillReceiveProps(t,r),n.state!==e&&Co.enqueueReplaceState(n,n.state,null)}function kl(e,n,t,r){var o=e.stateNode;o.props=t,o.state=e.memoizedState,o.refs={},ll(e);var i=n.contextType;typeof i=="object"&&i!==null?o.context=en(i):(i=He(n)?lt:Re.current,o.context=Mt(e,i)),o.state=e.memoizedState,i=n.getDerivedStateFromProps,typeof i=="function"&&(bl(e,n,i,t),o.state=e.memoizedState),typeof n.getDerivedStateFromProps=="function"||typeof o.getSnapshotBeforeUpdate=="function"||typeof o.UNSAFE_componentWillMount!="function"&&typeof o.componentWillMount!="function"||(n=o.state,typeof o.componentWillMount=="function"&&o.componentWillMount(),typeof o.UNSAFE_componentWillMount=="function"&&o.UNSAFE_componentWillMount(),n!==o.state&&Co.enqueueReplaceState(o,o.state,null),xo(e,t,o,r),o.state=e.memoizedState),typeof o.componentDidMount=="function"&&(e.flags|=4194308)}function Ht(e,n){try{var t="",r=n;do t+=G(r),r=r.return;while(r);var o=t}catch(i){o=`
Error generating stack: `+i.message+`
`+i.stack}return{value:e,source:n,stack:o,digest:null}}function xl(e,n,t){return{value:e,source:null,stack:t??null,digest:n??null}}function wl(e,n){try{console.error(n.value)}catch(t){setTimeout(function(){throw t})}}var hf=typeof WeakMap=="function"?WeakMap:Map;function gs(e,n,t){t=Cn(-1,t),t.tag=3,t.payload={element:null};var r=n.value;return t.callback=function(){Ao||(Ao=!0,jl=r),wl(e,n)},t}function ys(e,n,t){t=Cn(-1,t),t.tag=3;var r=e.type.getDerivedStateFromError;if(typeof r=="function"){var o=n.value;t.payload=function(){return r(o)},t.callback=function(){wl(e,n)}}var i=e.stateNode;return i!==null&&typeof i.componentDidCatch=="function"&&(t.callback=function(){wl(e,n),typeof r!="function"&&(Xn===null?Xn=new Set([this]):Xn.add(this));var u=n.stack;this.componentDidCatch(n.value,{componentStack:u!==null?u:""})}),t}function bs(e,n,t){var r=e.pingCache;if(r===null){r=e.pingCache=new hf;var o=new Set;r.set(n,o)}else o=r.get(n),o===void 0&&(o=new Set,r.set(n,o));o.has(t)||(o.add(t),e=Cf.bind(null,e,n,t),n.then(e,e))}function ks(e){do{var n;if((n=e.tag===13)&&(n=e.memoizedState,n=n!==null?n.dehydrated!==null:!0),n)return e;e=e.return}while(e!==null);return null}function xs(e,n,t,r,o){return(e.mode&1)===0?(e===n?e.flags|=65536:(e.flags|=128,t.flags|=131072,t.flags&=-52805,t.tag===1&&(t.alternate===null?t.tag=17:(n=Cn(-1,1),n.tag=2,Qn(t,n,1))),t.lanes|=1),e):(e.flags|=65536,e.lanes=o,e)}var mf=he.ReactCurrentOwner,Ue=!1;function je(e,n,t,r){n.child=e===null?Uu(n,null,t,r):Lt(n,e.child,t,r)}function ws(e,n,t,r,o){t=t.render;var i=n.ref;return Ft(n,o),r=pl(e,n,t,r,i,o),t=hl(),e!==null&&!Ue?(n.updateQueue=e.updateQueue,n.flags&=-2053,e.lanes&=~o,Tn(e,n,o)):(le&&t&&Yi(n),n.flags|=1,je(e,n,r,o),n.child)}function Ss(e,n,t,r,o){if(e===null){var i=t.type;return typeof i=="function"&&!Vl(i)&&i.defaultProps===void 0&&t.compare===null&&t.defaultProps===void 0?(n.tag=15,n.type=i,Ps(e,n,i,r,o)):(e=Uo(t.type,null,r,n,n.mode,o),e.ref=n.ref,e.return=n,n.child=e)}if(i=e.child,(e.lanes&o)===0){var u=i.memoizedProps;if(t=t.compare,t=t!==null?t:fr,t(u,r)&&e.ref===n.ref)return Tn(e,n,o)}return n.flags|=1,e=Gn(i,r),e.ref=n.ref,e.return=n,n.child=e}function Ps(e,n,t,r,o){if(e!==null){var i=e.memoizedProps;if(fr(i,r)&&e.ref===n.ref)if(Ue=!1,n.pendingProps=r=i,(e.lanes&o)!==0)(e.flags&131072)!==0&&(Ue=!0);else return n.lanes=e.lanes,Tn(e,n,o)}return Sl(e,n,t,r,o)}function Os(e,n,t){var r=n.pendingProps,o=r.children,i=e!==null?e.memoizedState:null;if(r.mode==="hidden")if((n.mode&1)===0)n.memoizedState={baseLanes:0,cachePool:null,transitions:null},ne($t,Ke),Ke|=t;else{if((t&1073741824)===0)return e=i!==null?i.baseLanes|t:t,n.lanes=n.childLanes=1073741824,n.memoizedState={baseLanes:e,cachePool:null,transitions:null},n.updateQueue=null,ne($t,Ke),Ke|=e,null;n.memoizedState={baseLanes:0,cachePool:null,transitions:null},r=i!==null?i.baseLanes:t,ne($t,Ke),Ke|=r}else i!==null?(r=i.baseLanes|t,n.memoizedState=null):r=t,ne($t,Ke),Ke|=r;return je(e,n,o,t),n.child}function Es(e,n){var t=n.ref;(e===null&&t!==null||e!==null&&e.ref!==t)&&(n.flags|=512,n.flags|=2097152)}function Sl(e,n,t,r,o){var i=He(t)?lt:Re.current;return i=Mt(n,i),Ft(n,o),t=pl(e,n,t,r,i,o),r=hl(),e!==null&&!Ue?(n.updateQueue=e.updateQueue,n.flags&=-2053,e.lanes&=~o,Tn(e,n,o)):(le&&r&&Yi(n),n.flags|=1,je(e,n,t,o),n.child)}function _s(e,n,t,r,o){if(He(t)){var i=!0;fo(n)}else i=!1;if(Ft(n,o),n.stateNode===null)zo(e,n),ms(n,t,r),kl(n,t,r,o),r=!0;else if(e===null){var u=n.stateNode,d=n.memoizedProps;u.props=d;var f=u.context,b=t.contextType;typeof b=="object"&&b!==null?b=en(b):(b=He(t)?lt:Re.current,b=Mt(n,b));var P=t.getDerivedStateFromProps,O=typeof P=="function"||typeof u.getSnapshotBeforeUpdate=="function";O||typeof u.UNSAFE_componentWillReceiveProps!="function"&&typeof u.componentWillReceiveProps!="function"||(d!==r||f!==b)&&vs(n,u,r,b),Wn=!1;var S=n.memoizedState;u.state=S,xo(n,r,u,o),f=n.memoizedState,d!==r||S!==f||Ie.current||Wn?(typeof P=="function"&&(bl(n,t,P,r),f=n.memoizedState),(d=Wn||hs(n,t,d,r,S,f,b))?(O||typeof u.UNSAFE_componentWillMount!="function"&&typeof u.componentWillMount!="function"||(typeof u.componentWillMount=="function"&&u.componentWillMount(),typeof u.UNSAFE_componentWillMount=="function"&&u.UNSAFE_componentWillMount()),typeof u.componentDidMount=="function"&&(n.flags|=4194308)):(typeof u.componentDidMount=="function"&&(n.flags|=4194308),n.memoizedProps=r,n.memoizedState=f),u.props=r,u.state=f,u.context=b,r=d):(typeof u.componentDidMount=="function"&&(n.flags|=4194308),r=!1)}else{u=n.stateNode,Bu(e,n),d=n.memoizedProps,b=n.type===n.elementType?d:sn(n.type,d),u.props=b,O=n.pendingProps,S=u.context,f=t.contextType,typeof f=="object"&&f!==null?f=en(f):(f=He(t)?lt:Re.current,f=Mt(n,f));var z=t.getDerivedStateFromProps;(P=typeof z=="function"||typeof u.getSnapshotBeforeUpdate=="function")||typeof u.UNSAFE_componentWillReceiveProps!="function"&&typeof u.componentWillReceiveProps!="function"||(d!==O||S!==f)&&vs(n,u,r,f),Wn=!1,S=n.memoizedState,u.state=S,xo(n,r,u,o);var M=n.memoizedState;d!==O||S!==M||Ie.current||Wn?(typeof z=="function"&&(bl(n,t,z,r),M=n.memoizedState),(b=Wn||hs(n,t,b,r,S,M,f)||!1)?(P||typeof u.UNSAFE_componentWillUpdate!="function"&&typeof u.componentWillUpdate!="function"||(typeof u.componentWillUpdate=="function"&&u.componentWillUpdate(r,M,f),typeof u.UNSAFE_componentWillUpdate=="function"&&u.UNSAFE_componentWillUpdate(r,M,f)),typeof u.componentDidUpdate=="function"&&(n.flags|=4),typeof u.getSnapshotBeforeUpdate=="function"&&(n.flags|=1024)):(typeof u.componentDidUpdate!="function"||d===e.memoizedProps&&S===e.memoizedState||(n.flags|=4),typeof u.getSnapshotBeforeUpdate!="function"||d===e.memoizedProps&&S===e.memoizedState||(n.flags|=1024),n.memoizedProps=r,n.memoizedState=M),u.props=r,u.state=M,u.context=f,r=b):(typeof u.componentDidUpdate!="function"||d===e.memoizedProps&&S===e.memoizedState||(n.flags|=4),typeof u.getSnapshotBeforeUpdate!="function"||d===e.memoizedProps&&S===e.memoizedState||(n.flags|=1024),r=!1)}return Pl(e,n,t,r,i,o)}function Pl(e,n,t,r,o,i){Es(e,n);var u=(n.flags&128)!==0;if(!r&&!u)return o&&Mu(n,t,!1),Tn(e,n,i);r=n.stateNode,mf.current=n;var d=u&&typeof t.getDerivedStateFromError!="function"?null:r.render();return n.flags|=1,e!==null&&u?(n.child=Lt(n,e.child,null,i),n.child=Lt(n,null,d,i)):je(e,n,d,i),n.memoizedState=r.state,o&&Mu(n,t,!0),n.child}function Cs(e){var n=e.stateNode;n.pendingContext?zu(e,n.pendingContext,n.pendingContext!==n.context):n.context&&zu(e,n.context,!1),al(e,n.containerInfo)}function Ts(e,n,t,r,o){return At(),el(o),n.flags|=256,je(e,n,t,r),n.child}var Ol={dehydrated:null,treeContext:null,retryLane:0};function El(e){return{baseLanes:e,cachePool:null,transitions:null}}function zs(e,n,t){var r=n.pendingProps,o=ue.current,i=!1,u=(n.flags&128)!==0,d;if((d=u)||(d=e!==null&&e.memoizedState===null?!1:(o&2)!==0),d?(i=!0,n.flags&=-129):(e===null||e.memoizedState!==null)&&(o|=1),ne(ue,o&1),e===null)return Ji(n),e=n.memoizedState,e!==null&&(e=e.dehydrated,e!==null)?((n.mode&1)===0?n.lanes=1:e.data==="$!"?n.lanes=8:n.lanes=1073741824,null):(u=r.children,e=r.fallback,i?(r=n.mode,i=n.child,u={mode:"hidden",children:u},(r&1)===0&&i!==null?(i.childLanes=0,i.pendingProps=u):i=$o(u,r,0,null),e=vt(e,r,t,null),i.return=n,e.return=n,i.sibling=e,n.child=i,n.child.memoizedState=El(t),n.memoizedState=Ol,e):_l(n,u));if(o=e.memoizedState,o!==null&&(d=o.dehydrated,d!==null))return vf(e,n,u,r,d,o,t);if(i){i=r.fallback,u=n.mode,o=e.child,d=o.sibling;var f={mode:"hidden",children:r.children};return(u&1)===0&&n.child!==o?(r=n.child,r.childLanes=0,r.pendingProps=f,n.deletions=null):(r=Gn(o,f),r.subtreeFlags=o.subtreeFlags&14680064),d!==null?i=Gn(d,i):(i=vt(i,u,t,null),i.flags|=2),i.return=n,r.return=n,r.sibling=i,n.child=r,r=i,i=n.child,u=e.child.memoizedState,u=u===null?El(t):{baseLanes:u.baseLanes|t,cachePool:null,transitions:u.transitions},i.memoizedState=u,i.childLanes=e.childLanes&~t,n.memoizedState=Ol,r}return i=e.child,e=i.sibling,r=Gn(i,{mode:"visible",children:r.children}),(n.mode&1)===0&&(r.lanes=t),r.return=n,r.sibling=null,e!==null&&(t=n.deletions,t===null?(n.deletions=[e],n.flags|=16):t.push(e)),n.child=r,n.memoizedState=null,r}function _l(e,n){return n=$o({mode:"visible",children:n},e.mode,0,null),n.return=e,e.child=n}function To(e,n,t,r){return r!==null&&el(r),Lt(n,e.child,null,t),e=_l(n,n.pendingProps.children),e.flags|=2,n.memoizedState=null,e}function vf(e,n,t,r,o,i,u){if(t)return n.flags&256?(n.flags&=-257,r=xl(Error(a(422))),To(e,n,u,r)):n.memoizedState!==null?(n.child=e.child,n.flags|=128,null):(i=r.fallback,o=n.mode,r=$o({mode:"visible",children:r.children},o,0,null),i=vt(i,o,u,null),i.flags|=2,r.return=n,i.return=n,r.sibling=i,n.child=r,(n.mode&1)!==0&&Lt(n,e.child,null,u),n.child.memoizedState=El(u),n.memoizedState=Ol,i);if((n.mode&1)===0)return To(e,n,u,null);if(o.data==="$!"){if(r=o.nextSibling&&o.nextSibling.dataset,r)var d=r.dgst;return r=d,i=Error(a(419)),r=xl(i,r,void 0),To(e,n,u,r)}if(d=(u&e.childLanes)!==0,Ue||d){if(r=Se,r!==null){switch(u&-u){case 4:o=2;break;case 16:o=8;break;case 64:case 128:case 256:case 512:case 1024:case 2048:case 4096:case 8192:case 16384:case 32768:case 65536:case 131072:case 262144:case 524288:case 1048576:case 2097152:case 4194304:case 8388608:case 16777216:case 33554432:case 67108864:o=32;break;case 536870912:o=268435456;break;default:o=0}o=(o&(r.suspendedLanes|u))!==0?0:o,o!==0&&o!==i.retryLane&&(i.retryLane=o,_n(e,o),fn(r,e,o,-1))}return Bl(),r=xl(Error(a(421))),To(e,n,u,r)}return o.data==="$?"?(n.flags|=128,n.child=e.child,n=Tf.bind(null,e),o._reactRetry=n,null):(e=i.treeContext,Xe=Un(o.nextSibling),qe=n,le=!0,un=null,e!==null&&(Ge[Je++]=On,Ge[Je++]=En,Ge[Je++]=at,On=e.id,En=e.overflow,at=n),n=_l(n,r.children),n.flags|=4096,n)}function Ds(e,n,t){e.lanes|=n;var r=e.alternate;r!==null&&(r.lanes|=n),ol(e.return,n,t)}function Cl(e,n,t,r,o){var i=e.memoizedState;i===null?e.memoizedState={isBackwards:n,rendering:null,renderingStartTime:0,last:r,tail:t,tailMode:o}:(i.isBackwards=n,i.rendering=null,i.renderingStartTime=0,i.last=r,i.tail=t,i.tailMode=o)}function Ms(e,n,t){var r=n.pendingProps,o=r.revealOrder,i=r.tail;if(je(e,n,r.children,t),r=ue.current,(r&2)!==0)r=r&1|2,n.flags|=128;else{if(e!==null&&(e.flags&128)!==0)e:for(e=n.child;e!==null;){if(e.tag===13)e.memoizedState!==null&&Ds(e,t,n);else if(e.tag===19)Ds(e,t,n);else if(e.child!==null){e.child.return=e,e=e.child;continue}if(e===n)break e;for(;e.sibling===null;){if(e.return===null||e.return===n)break e;e=e.return}e.sibling.return=e.return,e=e.sibling}r&=1}if(ne(ue,r),(n.mode&1)===0)n.memoizedState=null;else switch(o){case"forwards":for(t=n.child,o=null;t!==null;)e=t.alternate,e!==null&&wo(e)===null&&(o=t),t=t.sibling;t=o,t===null?(o=n.child,n.child=null):(o=t.sibling,t.sibling=null),Cl(n,!1,o,t,i);break;case"backwards":for(t=null,o=n.child,n.child=null;o!==null;){if(e=o.alternate,e!==null&&wo(e)===null){n.child=o;break}e=o.sibling,o.sibling=t,t=o,o=e}Cl(n,!0,t,null,i);break;case"together":Cl(n,!1,null,null,void 0);break;default:n.memoizedState=null}return n.child}function zo(e,n){(n.mode&1)===0&&e!==null&&(e.alternate=null,n.alternate=null,n.flags|=2)}function Tn(e,n,t){if(e!==null&&(n.dependencies=e.dependencies),ft|=n.lanes,(t&n.childLanes)===0)return null;if(e!==null&&n.child!==e.child)throw Error(a(153));if(n.child!==null){for(e=n.child,t=Gn(e,e.pendingProps),n.child=t,t.return=n;e.sibling!==null;)e=e.sibling,t=t.sibling=Gn(e,e.pendingProps),t.return=n;t.sibling=null}return n.child}function gf(e,n,t){switch(n.tag){case 3:Cs(n),At();break;case 5:Qu(n);break;case 1:He(n.type)&&fo(n);break;case 4:al(n,n.stateNode.containerInfo);break;case 10:var r=n.type._context,o=n.memoizedProps.value;ne(yo,r._currentValue),r._currentValue=o;break;case 13:if(r=n.memoizedState,r!==null)return r.dehydrated!==null?(ne(ue,ue.current&1),n.flags|=128,null):(t&n.child.childLanes)!==0?zs(e,n,t):(ne(ue,ue.current&1),e=Tn(e,n,t),e!==null?e.sibling:null);ne(ue,ue.current&1);break;case 19:if(r=(t&n.childLanes)!==0,(e.flags&128)!==0){if(r)return Ms(e,n,t);n.flags|=128}if(o=n.memoizedState,o!==null&&(o.rendering=null,o.tail=null,o.lastEffect=null),ne(ue,ue.current),r)break;return null;case 22:case 23:return n.lanes=0,Os(e,n,t)}return Tn(e,n,t)}var Rs,Tl,Ns,As;Rs=function(e,n){for(var t=n.child;t!==null;){if(t.tag===5||t.tag===6)e.appendChild(t.stateNode);else if(t.tag!==4&&t.child!==null){t.child.return=t,t=t.child;continue}if(t===n)break;for(;t.sibling===null;){if(t.return===null||t.return===n)return;t=t.return}t.sibling.return=t.return,t=t.sibling}},Tl=function(){},Ns=function(e,n,t,r){var o=e.memoizedProps;if(o!==r){e=n.stateNode,ct(bn.current);var i=null;switch(t){case"input":o=oi(e,o),r=oi(e,r),i=[];break;case"select":o=ee({},o,{value:void 0}),r=ee({},r,{value:void 0}),i=[];break;case"textarea":o=ai(e,o),r=ai(e,r),i=[];break;default:typeof o.onClick!="function"&&typeof r.onClick=="function"&&(e.onclick=uo)}si(t,r);var u;t=null;for(b in o)if(!r.hasOwnProperty(b)&&o.hasOwnProperty(b)&&o[b]!=null)if(b==="style"){var d=o[b];for(u in d)d.hasOwnProperty(u)&&(t||(t={}),t[u]="")}else b!=="dangerouslySetInnerHTML"&&b!=="children"&&b!=="suppressContentEditableWarning"&&b!=="suppressHydrationWarning"&&b!=="autoFocus"&&(h.hasOwnProperty(b)?i||(i=[]):(i=i||[]).push(b,null));for(b in r){var f=r[b];if(d=o!=null?o[b]:void 0,r.hasOwnProperty(b)&&f!==d&&(f!=null||d!=null))if(b==="style")if(d){for(u in d)!d.hasOwnProperty(u)||f&&f.hasOwnProperty(u)||(t||(t={}),t[u]="");for(u in f)f.hasOwnProperty(u)&&d[u]!==f[u]&&(t||(t={}),t[u]=f[u])}else t||(i||(i=[]),i.push(b,t)),t=f;else b==="dangerouslySetInnerHTML"?(f=f?f.__html:void 0,d=d?d.__html:void 0,f!=null&&d!==f&&(i=i||[]).push(b,f)):b==="children"?typeof f!="string"&&typeof f!="number"||(i=i||[]).push(b,""+f):b!=="suppressContentEditableWarning"&&b!=="suppressHydrationWarning"&&(h.hasOwnProperty(b)?(f!=null&&b==="onScroll"&&te("scroll",e),i||d===f||(i=[])):(i=i||[]).push(b,f))}t&&(i=i||[]).push("style",t);var b=i;(n.updateQueue=b)&&(n.flags|=4)}},As=function(e,n,t,r){t!==r&&(n.flags|=4)};function _r(e,n){if(!le)switch(e.tailMode){case"hidden":n=e.tail;for(var t=null;n!==null;)n.alternate!==null&&(t=n),n=n.sibling;t===null?e.tail=null:t.sibling=null;break;case"collapsed":t=e.tail;for(var r=null;t!==null;)t.alternate!==null&&(r=t),t=t.sibling;r===null?n||e.tail===null?e.tail=null:e.tail.sibling=null:r.sibling=null}}function Ae(e){var n=e.alternate!==null&&e.alternate.child===e.child,t=0,r=0;if(n)for(var o=e.child;o!==null;)t|=o.lanes|o.childLanes,r|=o.subtreeFlags&14680064,r|=o.flags&14680064,o.return=e,o=o.sibling;else for(o=e.child;o!==null;)t|=o.lanes|o.childLanes,r|=o.subtreeFlags,r|=o.flags,o.return=e,o=o.sibling;return e.subtreeFlags|=r,e.childLanes=t,n}function yf(e,n,t){var r=n.pendingProps;switch(Zi(n),n.tag){case 2:case 16:case 15:case 0:case 11:case 7:case 8:case 12:case 9:case 14:return Ae(n),null;case 1:return He(n.type)&&co(),Ae(n),null;case 3:return r=n.stateNode,It(),re(Ie),re(Re),cl(),r.pendingContext&&(r.context=r.pendingContext,r.pendingContext=null),(e===null||e.child===null)&&(vo(n)?n.flags|=4:e===null||e.memoizedState.isDehydrated&&(n.flags&256)===0||(n.flags|=1024,un!==null&&(Hl(un),un=null))),Tl(e,n),Ae(n),null;case 5:ul(n);var o=ct(wr.current);if(t=n.type,e!==null&&n.stateNode!=null)Ns(e,n,t,r,o),e.ref!==n.ref&&(n.flags|=512,n.flags|=2097152);else{if(!r){if(n.stateNode===null)throw Error(a(166));return Ae(n),null}if(e=ct(bn.current),vo(n)){r=n.stateNode,t=n.type;var i=n.memoizedProps;switch(r[yn]=n,r[gr]=i,e=(n.mode&1)!==0,t){case"dialog":te("cancel",r),te("close",r);break;case"iframe":case"object":case"embed":te("load",r);break;case"video":case"audio":for(o=0;o<hr.length;o++)te(hr[o],r);break;case"source":te("error",r);break;case"img":case"image":case"link":te("error",r),te("load",r);break;case"details":te("toggle",r);break;case"input":ma(r,i),te("invalid",r);break;case"select":r._wrapperState={wasMultiple:!!i.multiple},te("invalid",r);break;case"textarea":ya(r,i),te("invalid",r)}si(t,i),o=null;for(var u in i)if(i.hasOwnProperty(u)){var d=i[u];u==="children"?typeof d=="string"?r.textContent!==d&&(i.suppressHydrationWarning!==!0&&ao(r.textContent,d,e),o=["children",d]):typeof d=="number"&&r.textContent!==""+d&&(i.suppressHydrationWarning!==!0&&ao(r.textContent,d,e),o=["children",""+d]):h.hasOwnProperty(u)&&d!=null&&u==="onScroll"&&te("scroll",r)}switch(t){case"input":Fr(r),ga(r,i,!0);break;case"textarea":Fr(r),ka(r);break;case"select":case"option":break;default:typeof i.onClick=="function"&&(r.onclick=uo)}r=o,n.updateQueue=r,r!==null&&(n.flags|=4)}else{u=o.nodeType===9?o:o.ownerDocument,e==="http://www.w3.org/1999/xhtml"&&(e=xa(t)),e==="http://www.w3.org/1999/xhtml"?t==="script"?(e=u.createElement("div"),e.innerHTML="<script><\/script>",e=e.removeChild(e.firstChild)):typeof r.is=="string"?e=u.createElement(t,{is:r.is}):(e=u.createElement(t),t==="select"&&(u=e,r.multiple?u.multiple=!0:r.size&&(u.size=r.size))):e=u.createElementNS(e,t),e[yn]=n,e[gr]=r,Rs(e,n,!1,!1),n.stateNode=e;e:{switch(u=ci(t,r),t){case"dialog":te("cancel",e),te("close",e),o=r;break;case"iframe":case"object":case"embed":te("load",e),o=r;break;case"video":case"audio":for(o=0;o<hr.length;o++)te(hr[o],e);o=r;break;case"source":te("error",e),o=r;break;case"img":case"image":case"link":te("error",e),te("load",e),o=r;break;case"details":te("toggle",e),o=r;break;case"input":ma(e,r),o=oi(e,r),te("invalid",e);break;case"option":o=r;break;case"select":e._wrapperState={wasMultiple:!!r.multiple},o=ee({},r,{value:void 0}),te("invalid",e);break;case"textarea":ya(e,r),o=ai(e,r),te("invalid",e);break;default:o=r}si(t,o),d=o;for(i in d)if(d.hasOwnProperty(i)){var f=d[i];i==="style"?Pa(e,f):i==="dangerouslySetInnerHTML"?(f=f?f.__html:void 0,f!=null&&wa(e,f)):i==="children"?typeof f=="string"?(t!=="textarea"||f!=="")&&Kt(e,f):typeof f=="number"&&Kt(e,""+f):i!=="suppressContentEditableWarning"&&i!=="suppressHydrationWarning"&&i!=="autoFocus"&&(h.hasOwnProperty(i)?f!=null&&i==="onScroll"&&te("scroll",e):f!=null&&be(e,i,f,u))}switch(t){case"input":Fr(e),ga(e,r,!1);break;case"textarea":Fr(e),ka(e);break;case"option":r.value!=null&&e.setAttribute("value",""+Y(r.value));break;case"select":e.multiple=!!r.multiple,i=r.value,i!=null?kt(e,!!r.multiple,i,!1):r.defaultValue!=null&&kt(e,!!r.multiple,r.defaultValue,!0);break;default:typeof o.onClick=="function"&&(e.onclick=uo)}switch(t){case"button":case"input":case"select":case"textarea":r=!!r.autoFocus;break e;case"img":r=!0;break e;default:r=!1}}r&&(n.flags|=4)}n.ref!==null&&(n.flags|=512,n.flags|=2097152)}return Ae(n),null;case 6:if(e&&n.stateNode!=null)As(e,n,e.memoizedProps,r);else{if(typeof r!="string"&&n.stateNode===null)throw Error(a(166));if(t=ct(wr.current),ct(bn.current),vo(n)){if(r=n.stateNode,t=n.memoizedProps,r[yn]=n,(i=r.nodeValue!==t)&&(e=qe,e!==null))switch(e.tag){case 3:ao(r.nodeValue,t,(e.mode&1)!==0);break;case 5:e.memoizedProps.suppressHydrationWarning!==!0&&ao(r.nodeValue,t,(e.mode&1)!==0)}i&&(n.flags|=4)}else r=(t.nodeType===9?t:t.ownerDocument).createTextNode(r),r[yn]=n,n.stateNode=r}return Ae(n),null;case 13:if(re(ue),r=n.memoizedState,e===null||e.memoizedState!==null&&e.memoizedState.dehydrated!==null){if(le&&Xe!==null&&(n.mode&1)!==0&&(n.flags&128)===0)Fu(),At(),n.flags|=98560,i=!1;else if(i=vo(n),r!==null&&r.dehydrated!==null){if(e===null){if(!i)throw Error(a(318));if(i=n.memoizedState,i=i!==null?i.dehydrated:null,!i)throw Error(a(317));i[yn]=n}else At(),(n.flags&128)===0&&(n.memoizedState=null),n.flags|=4;Ae(n),i=!1}else un!==null&&(Hl(un),un=null),i=!0;if(!i)return n.flags&65536?n:null}return(n.flags&128)!==0?(n.lanes=t,n):(r=r!==null,r!==(e!==null&&e.memoizedState!==null)&&r&&(n.child.flags|=8192,(n.mode&1)!==0&&(e===null||(ue.current&1)!==0?ge===0&&(ge=3):Bl())),n.updateQueue!==null&&(n.flags|=4),Ae(n),null);case 4:return It(),Tl(e,n),e===null&&mr(n.stateNode.containerInfo),Ae(n),null;case 10:return rl(n.type._context),Ae(n),null;case 17:return He(n.type)&&co(),Ae(n),null;case 19:if(re(ue),i=n.memoizedState,i===null)return Ae(n),null;if(r=(n.flags&128)!==0,u=i.rendering,u===null)if(r)_r(i,!1);else{if(ge!==0||e!==null&&(e.flags&128)!==0)for(e=n.child;e!==null;){if(u=wo(e),u!==null){for(n.flags|=128,_r(i,!1),r=u.updateQueue,r!==null&&(n.updateQueue=r,n.flags|=4),n.subtreeFlags=0,r=t,t=n.child;t!==null;)i=t,e=r,i.flags&=14680066,u=i.alternate,u===null?(i.childLanes=0,i.lanes=e,i.child=null,i.subtreeFlags=0,i.memoizedProps=null,i.memoizedState=null,i.updateQueue=null,i.dependencies=null,i.stateNode=null):(i.childLanes=u.childLanes,i.lanes=u.lanes,i.child=u.child,i.subtreeFlags=0,i.deletions=null,i.memoizedProps=u.memoizedProps,i.memoizedState=u.memoizedState,i.updateQueue=u.updateQueue,i.type=u.type,e=u.dependencies,i.dependencies=e===null?null:{lanes:e.lanes,firstContext:e.firstContext}),t=t.sibling;return ne(ue,ue.current&1|2),n.child}e=e.sibling}i.tail!==null&&fe()>Bt&&(n.flags|=128,r=!0,_r(i,!1),n.lanes=4194304)}else{if(!r)if(e=wo(u),e!==null){if(n.flags|=128,r=!0,t=e.updateQueue,t!==null&&(n.updateQueue=t,n.flags|=4),_r(i,!0),i.tail===null&&i.tailMode==="hidden"&&!u.alternate&&!le)return Ae(n),null}else 2*fe()-i.renderingStartTime>Bt&&t!==1073741824&&(n.flags|=128,r=!0,_r(i,!1),n.lanes=4194304);i.isBackwards?(u.sibling=n.child,n.child=u):(t=i.last,t!==null?t.sibling=u:n.child=u,i.last=u)}return i.tail!==null?(n=i.tail,i.rendering=n,i.tail=n.sibling,i.renderingStartTime=fe(),n.sibling=null,t=ue.current,ne(ue,r?t&1|2:t&1),n):(Ae(n),null);case 22:case 23:return $l(),r=n.memoizedState!==null,e!==null&&e.memoizedState!==null!==r&&(n.flags|=8192),r&&(n.mode&1)!==0?(Ke&1073741824)!==0&&(Ae(n),n.subtreeFlags&6&&(n.flags|=8192)):Ae(n),null;case 24:return null;case 25:return null}throw Error(a(156,n.tag))}function bf(e,n){switch(Zi(n),n.tag){case 1:return He(n.type)&&co(),e=n.flags,e&65536?(n.flags=e&-65537|128,n):null;case 3:return It(),re(Ie),re(Re),cl(),e=n.flags,(e&65536)!==0&&(e&128)===0?(n.flags=e&-65537|128,n):null;case 5:return ul(n),null;case 13:if(re(ue),e=n.memoizedState,e!==null&&e.dehydrated!==null){if(n.alternate===null)throw Error(a(340));At()}return e=n.flags,e&65536?(n.flags=e&-65537|128,n):null;case 19:return re(ue),null;case 4:return It(),null;case 10:return rl(n.type._context),null;case 22:case 23:return $l(),null;case 24:return null;default:return null}}var Do=!1,Le=!1,kf=typeof WeakSet=="function"?WeakSet:Set,D=null;function Ut(e,n){var t=e.ref;if(t!==null)if(typeof t=="function")try{t(null)}catch(r){ce(e,n,r)}else t.current=null}function zl(e,n,t){try{t()}catch(r){ce(e,n,r)}}var Ls=!1;function xf(e,n){if($i=Yr,e=hu(),Ni(e)){if("selectionStart"in e)var t={start:e.selectionStart,end:e.selectionEnd};else e:{t=(t=e.ownerDocument)&&t.defaultView||window;var r=t.getSelection&&t.getSelection();if(r&&r.rangeCount!==0){t=r.anchorNode;var o=r.anchorOffset,i=r.focusNode;r=r.focusOffset;try{t.nodeType,i.nodeType}catch{t=null;break e}var u=0,d=-1,f=-1,b=0,P=0,O=e,S=null;n:for(;;){for(var z;O!==t||o!==0&&O.nodeType!==3||(d=u+o),O!==i||r!==0&&O.nodeType!==3||(f=u+r),O.nodeType===3&&(u+=O.nodeValue.length),(z=O.firstChild)!==null;)S=O,O=z;for(;;){if(O===e)break n;if(S===t&&++b===o&&(d=u),S===i&&++P===r&&(f=u),(z=O.nextSibling)!==null)break;O=S,S=O.parentNode}O=z}t=d===-1||f===-1?null:{start:d,end:f}}else t=null}t=t||{start:0,end:0}}else t=null;for(Bi={focusedElem:e,selectionRange:t},Yr=!1,D=n;D!==null;)if(n=D,e=n.child,(n.subtreeFlags&1028)!==0&&e!==null)e.return=n,D=e;else for(;D!==null;){n=D;try{var M=n.alternate;if((n.flags&1024)!==0)switch(n.tag){case 0:case 11:case 15:break;case 1:if(M!==null){var R=M.memoizedProps,pe=M.memoizedState,m=n.stateNode,p=m.getSnapshotBeforeUpdate(n.elementType===n.type?R:sn(n.type,R),pe);m.__reactInternalSnapshotBeforeUpdate=p}break;case 3:var g=n.stateNode.containerInfo;g.nodeType===1?g.textContent="":g.nodeType===9&&g.documentElement&&g.removeChild(g.documentElement);break;case 5:case 6:case 4:case 17:break;default:throw Error(a(163))}}catch(E){ce(n,n.return,E)}if(e=n.sibling,e!==null){e.return=n.return,D=e;break}D=n.return}return M=Ls,Ls=!1,M}function Cr(e,n,t){var r=n.updateQueue;if(r=r!==null?r.lastEffect:null,r!==null){var o=r=r.next;do{if((o.tag&e)===e){var i=o.destroy;o.destroy=void 0,i!==void 0&&zl(n,t,i)}o=o.next}while(o!==r)}}function Mo(e,n){if(n=n.updateQueue,n=n!==null?n.lastEffect:null,n!==null){var t=n=n.next;do{if((t.tag&e)===e){var r=t.create;t.destroy=r()}t=t.next}while(t!==n)}}function Dl(e){var n=e.ref;if(n!==null){var t=e.stateNode;switch(e.tag){case 5:e=t;break;default:e=t}typeof n=="function"?n(e):n.current=e}}function js(e){var n=e.alternate;n!==null&&(e.alternate=null,js(n)),e.child=null,e.deletions=null,e.sibling=null,e.tag===5&&(n=e.stateNode,n!==null&&(delete n[yn],delete n[gr],delete n[qi],delete n[tf],delete n[rf])),e.stateNode=null,e.return=null,e.dependencies=null,e.memoizedProps=null,e.memoizedState=null,e.pendingProps=null,e.stateNode=null,e.updateQueue=null}function Fs(e){return e.tag===5||e.tag===3||e.tag===4}function Is(e){e:for(;;){for(;e.sibling===null;){if(e.return===null||Fs(e.return))return null;e=e.return}for(e.sibling.return=e.return,e=e.sibling;e.tag!==5&&e.tag!==6&&e.tag!==18;){if(e.flags&2||e.child===null||e.tag===4)continue e;e.child.return=e,e=e.child}if(!(e.flags&2))return e.stateNode}}function Ml(e,n,t){var r=e.tag;if(r===5||r===6)e=e.stateNode,n?t.nodeType===8?t.parentNode.insertBefore(e,n):t.insertBefore(e,n):(t.nodeType===8?(n=t.parentNode,n.insertBefore(e,t)):(n=t,n.appendChild(e)),t=t._reactRootContainer,t!=null||n.onclick!==null||(n.onclick=uo));else if(r!==4&&(e=e.child,e!==null))for(Ml(e,n,t),e=e.sibling;e!==null;)Ml(e,n,t),e=e.sibling}function Rl(e,n,t){var r=e.tag;if(r===5||r===6)e=e.stateNode,n?t.insertBefore(e,n):t.appendChild(e);else if(r!==4&&(e=e.child,e!==null))for(Rl(e,n,t),e=e.sibling;e!==null;)Rl(e,n,t),e=e.sibling}var Ce=null,cn=!1;function qn(e,n,t){for(t=t.child;t!==null;)Hs(e,n,t),t=t.sibling}function Hs(e,n,t){if(gn&&typeof gn.onCommitFiberUnmount=="function")try{gn.onCommitFiberUnmount(Vr,t)}catch{}switch(t.tag){case 5:Le||Ut(t,n);case 6:var r=Ce,o=cn;Ce=null,qn(e,n,t),Ce=r,cn=o,Ce!==null&&(cn?(e=Ce,t=t.stateNode,e.nodeType===8?e.parentNode.removeChild(t):e.removeChild(t)):Ce.removeChild(t.stateNode));break;case 18:Ce!==null&&(cn?(e=Ce,t=t.stateNode,e.nodeType===8?Qi(e.parentNode,t):e.nodeType===1&&Qi(e,t),lr(e)):Qi(Ce,t.stateNode));break;case 4:r=Ce,o=cn,Ce=t.stateNode.containerInfo,cn=!0,qn(e,n,t),Ce=r,cn=o;break;case 0:case 11:case 14:case 15:if(!Le&&(r=t.updateQueue,r!==null&&(r=r.lastEffect,r!==null))){o=r=r.next;do{var i=o,u=i.destroy;i=i.tag,u!==void 0&&((i&2)!==0||(i&4)!==0)&&zl(t,n,u),o=o.next}while(o!==r)}qn(e,n,t);break;case 1:if(!Le&&(Ut(t,n),r=t.stateNode,typeof r.componentWillUnmount=="function"))try{r.props=t.memoizedProps,r.state=t.memoizedState,r.componentWillUnmount()}catch(d){ce(t,n,d)}qn(e,n,t);break;case 21:qn(e,n,t);break;case 22:t.mode&1?(Le=(r=Le)||t.memoizedState!==null,qn(e,n,t),Le=r):qn(e,n,t);break;default:qn(e,n,t)}}function Us(e){var n=e.updateQueue;if(n!==null){e.updateQueue=null;var t=e.stateNode;t===null&&(t=e.stateNode=new kf),n.forEach(function(r){var o=zf.bind(null,e,r);t.has(r)||(t.add(r),r.then(o,o))})}}function dn(e,n){var t=n.deletions;if(t!==null)for(var r=0;r<t.length;r++){var o=t[r];try{var i=e,u=n,d=u;e:for(;d!==null;){switch(d.tag){case 5:Ce=d.stateNode,cn=!1;break e;case 3:Ce=d.stateNode.containerInfo,cn=!0;break e;case 4:Ce=d.stateNode.containerInfo,cn=!0;break e}d=d.return}if(Ce===null)throw Error(a(160));Hs(i,u,o),Ce=null,cn=!1;var f=o.alternate;f!==null&&(f.return=null),o.return=null}catch(b){ce(o,n,b)}}if(n.subtreeFlags&12854)for(n=n.child;n!==null;)$s(n,e),n=n.sibling}function $s(e,n){var t=e.alternate,r=e.flags;switch(e.tag){case 0:case 11:case 14:case 15:if(dn(n,e),xn(e),r&4){try{Cr(3,e,e.return),Mo(3,e)}catch(R){ce(e,e.return,R)}try{Cr(5,e,e.return)}catch(R){ce(e,e.return,R)}}break;case 1:dn(n,e),xn(e),r&512&&t!==null&&Ut(t,t.return);break;case 5:if(dn(n,e),xn(e),r&512&&t!==null&&Ut(t,t.return),e.flags&32){var o=e.stateNode;try{Kt(o,"")}catch(R){ce(e,e.return,R)}}if(r&4&&(o=e.stateNode,o!=null)){var i=e.memoizedProps,u=t!==null?t.memoizedProps:i,d=e.type,f=e.updateQueue;if(e.updateQueue=null,f!==null)try{d==="input"&&i.type==="radio"&&i.name!=null&&va(o,i),ci(d,u);var b=ci(d,i);for(u=0;u<f.length;u+=2){var P=f[u],O=f[u+1];P==="style"?Pa(o,O):P==="dangerouslySetInnerHTML"?wa(o,O):P==="children"?Kt(o,O):be(o,P,O,b)}switch(d){case"input":ii(o,i);break;case"textarea":ba(o,i);break;case"select":var S=o._wrapperState.wasMultiple;o._wrapperState.wasMultiple=!!i.multiple;var z=i.value;z!=null?kt(o,!!i.multiple,z,!1):S!==!!i.multiple&&(i.defaultValue!=null?kt(o,!!i.multiple,i.defaultValue,!0):kt(o,!!i.multiple,i.multiple?[]:"",!1))}o[gr]=i}catch(R){ce(e,e.return,R)}}break;case 6:if(dn(n,e),xn(e),r&4){if(e.stateNode===null)throw Error(a(162));o=e.stateNode,i=e.memoizedProps;try{o.nodeValue=i}catch(R){ce(e,e.return,R)}}break;case 3:if(dn(n,e),xn(e),r&4&&t!==null&&t.memoizedState.isDehydrated)try{lr(n.containerInfo)}catch(R){ce(e,e.return,R)}break;case 4:dn(n,e),xn(e);break;case 13:dn(n,e),xn(e),o=e.child,o.flags&8192&&(i=o.memoizedState!==null,o.stateNode.isHidden=i,!i||o.alternate!==null&&o.alternate.memoizedState!==null||(Ll=fe())),r&4&&Us(e);break;case 22:if(P=t!==null&&t.memoizedState!==null,e.mode&1?(Le=(b=Le)||P,dn(n,e),Le=b):dn(n,e),xn(e),r&8192){if(b=e.memoizedState!==null,(e.stateNode.isHidden=b)&&!P&&(e.mode&1)!==0)for(D=e,P=e.child;P!==null;){for(O=D=P;D!==null;){switch(S=D,z=S.child,S.tag){case 0:case 11:case 14:case 15:Cr(4,S,S.return);break;case 1:Ut(S,S.return);var M=S.stateNode;if(typeof M.componentWillUnmount=="function"){r=S,t=S.return;try{n=r,M.props=n.memoizedProps,M.state=n.memoizedState,M.componentWillUnmount()}catch(R){ce(r,t,R)}}break;case 5:Ut(S,S.return);break;case 22:if(S.memoizedState!==null){Ws(O);continue}}z!==null?(z.return=S,D=z):Ws(O)}P=P.sibling}e:for(P=null,O=e;;){if(O.tag===5){if(P===null){P=O;try{o=O.stateNode,b?(i=o.style,typeof i.setProperty=="function"?i.setProperty("display","none","important"):i.display="none"):(d=O.stateNode,f=O.memoizedProps.style,u=f!=null&&f.hasOwnProperty("display")?f.display:null,d.style.display=Sa("display",u))}catch(R){ce(e,e.return,R)}}}else if(O.tag===6){if(P===null)try{O.stateNode.nodeValue=b?"":O.memoizedProps}catch(R){ce(e,e.return,R)}}else if((O.tag!==22&&O.tag!==23||O.memoizedState===null||O===e)&&O.child!==null){O.child.return=O,O=O.child;continue}if(O===e)break e;for(;O.sibling===null;){if(O.return===null||O.return===e)break e;P===O&&(P=null),O=O.return}P===O&&(P=null),O.sibling.return=O.return,O=O.sibling}}break;case 19:dn(n,e),xn(e),r&4&&Us(e);break;case 21:break;default:dn(n,e),xn(e)}}function xn(e){var n=e.flags;if(n&2){try{e:{for(var t=e.return;t!==null;){if(Fs(t)){var r=t;break e}t=t.return}throw Error(a(160))}switch(r.tag){case 5:var o=r.stateNode;r.flags&32&&(Kt(o,""),r.flags&=-33);var i=Is(e);Rl(e,i,o);break;case 3:case 4:var u=r.stateNode.containerInfo,d=Is(e);Ml(e,d,u);break;default:throw Error(a(161))}}catch(f){ce(e,e.return,f)}e.flags&=-3}n&4096&&(e.flags&=-4097)}function wf(e,n,t){D=e,Bs(e)}function Bs(e,n,t){for(var r=(e.mode&1)!==0;D!==null;){var o=D,i=o.child;if(o.tag===22&&r){var u=o.memoizedState!==null||Do;if(!u){var d=o.alternate,f=d!==null&&d.memoizedState!==null||Le;d=Do;var b=Le;if(Do=u,(Le=f)&&!b)for(D=o;D!==null;)u=D,f=u.child,u.tag===22&&u.memoizedState!==null?Qs(o):f!==null?(f.return=u,D=f):Qs(o);for(;i!==null;)D=i,Bs(i),i=i.sibling;D=o,Do=d,Le=b}Vs(e)}else(o.subtreeFlags&8772)!==0&&i!==null?(i.return=o,D=i):Vs(e)}}function Vs(e){for(;D!==null;){var n=D;if((n.flags&8772)!==0){var t=n.alternate;try{if((n.flags&8772)!==0)switch(n.tag){case 0:case 11:case 15:Le||Mo(5,n);break;case 1:var r=n.stateNode;if(n.flags&4&&!Le)if(t===null)r.componentDidMount();else{var o=n.elementType===n.type?t.memoizedProps:sn(n.type,t.memoizedProps);r.componentDidUpdate(o,t.memoizedState,r.__reactInternalSnapshotBeforeUpdate)}var i=n.updateQueue;i!==null&&Wu(n,i,r);break;case 3:var u=n.updateQueue;if(u!==null){if(t=null,n.child!==null)switch(n.child.tag){case 5:t=n.child.stateNode;break;case 1:t=n.child.stateNode}Wu(n,u,t)}break;case 5:var d=n.stateNode;if(t===null&&n.flags&4){t=d;var f=n.memoizedProps;switch(n.type){case"button":case"input":case"select":case"textarea":f.autoFocus&&t.focus();break;case"img":f.src&&(t.src=f.src)}}break;case 6:break;case 4:break;case 12:break;case 13:if(n.memoizedState===null){var b=n.alternate;if(b!==null){var P=b.memoizedState;if(P!==null){var O=P.dehydrated;O!==null&&lr(O)}}}break;case 19:case 17:case 21:case 22:case 23:case 25:break;default:throw Error(a(163))}Le||n.flags&512&&Dl(n)}catch(S){ce(n,n.return,S)}}if(n===e){D=null;break}if(t=n.sibling,t!==null){t.return=n.return,D=t;break}D=n.return}}function Ws(e){for(;D!==null;){var n=D;if(n===e){D=null;break}var t=n.sibling;if(t!==null){t.return=n.return,D=t;break}D=n.return}}function Qs(e){for(;D!==null;){var n=D;try{switch(n.tag){case 0:case 11:case 15:var t=n.return;try{Mo(4,n)}catch(f){ce(n,t,f)}break;case 1:var r=n.stateNode;if(typeof r.componentDidMount=="function"){var o=n.return;try{r.componentDidMount()}catch(f){ce(n,o,f)}}var i=n.return;try{Dl(n)}catch(f){ce(n,i,f)}break;case 5:var u=n.return;try{Dl(n)}catch(f){ce(n,u,f)}}}catch(f){ce(n,n.return,f)}if(n===e){D=null;break}var d=n.sibling;if(d!==null){d.return=n.return,D=d;break}D=n.return}}var Sf=Math.ceil,Ro=he.ReactCurrentDispatcher,Nl=he.ReactCurrentOwner,tn=he.ReactCurrentBatchConfig,Q=0,Se=null,me=null,Te=0,Ke=0,$t=$n(0),ge=0,Tr=null,ft=0,No=0,Al=0,zr=null,$e=null,Ll=0,Bt=1/0,zn=null,Ao=!1,jl=null,Xn=null,Lo=!1,Kn=null,jo=0,Dr=0,Fl=null,Fo=-1,Io=0;function Fe(){return(Q&6)!==0?fe():Fo!==-1?Fo:Fo=fe()}function Yn(e){return(e.mode&1)===0?1:(Q&2)!==0&&Te!==0?Te&-Te:lf.transition!==null?(Io===0&&(Io=Ia()),Io):(e=Z,e!==0||(e=window.event,e=e===void 0?16:Xa(e.type)),e)}function fn(e,n,t,r){if(50<Dr)throw Dr=0,Fl=null,Error(a(185));nr(e,t,r),((Q&2)===0||e!==Se)&&(e===Se&&((Q&2)===0&&(No|=t),ge===4&&Zn(e,Te)),Be(e,r),t===1&&Q===0&&(n.mode&1)===0&&(Bt=fe()+500,po&&Vn()))}function Be(e,n){var t=e.callbackNode;id(e,n);var r=qr(e,e===Se?Te:0);if(r===0)t!==null&&La(t),e.callbackNode=null,e.callbackPriority=0;else if(n=r&-r,e.callbackPriority!==n){if(t!=null&&La(t),n===1)e.tag===0?of(Xs.bind(null,e)):Ru(Xs.bind(null,e)),ef(function(){(Q&6)===0&&Vn()}),t=null;else{switch(Ha(r)){case 1:t=gi;break;case 4:t=ja;break;case 16:t=Br;break;case 536870912:t=Fa;break;default:t=Br}t=tc(t,qs.bind(null,e))}e.callbackPriority=n,e.callbackNode=t}}function qs(e,n){if(Fo=-1,Io=0,(Q&6)!==0)throw Error(a(327));var t=e.callbackNode;if(Vt()&&e.callbackNode!==t)return null;var r=qr(e,e===Se?Te:0);if(r===0)return null;if((r&30)!==0||(r&e.expiredLanes)!==0||n)n=Ho(e,r);else{n=r;var o=Q;Q|=2;var i=Ys();(Se!==e||Te!==n)&&(zn=null,Bt=fe()+500,ht(e,n));do try{Ef();break}catch(d){Ks(e,d)}while(!0);tl(),Ro.current=i,Q=o,me!==null?n=0:(Se=null,Te=0,n=ge)}if(n!==0){if(n===2&&(o=yi(e),o!==0&&(r=o,n=Il(e,o))),n===1)throw t=Tr,ht(e,0),Zn(e,r),Be(e,fe()),t;if(n===6)Zn(e,r);else{if(o=e.current.alternate,(r&30)===0&&!Pf(o)&&(n=Ho(e,r),n===2&&(i=yi(e),i!==0&&(r=i,n=Il(e,i))),n===1))throw t=Tr,ht(e,0),Zn(e,r),Be(e,fe()),t;switch(e.finishedWork=o,e.finishedLanes=r,n){case 0:case 1:throw Error(a(345));case 2:mt(e,$e,zn);break;case 3:if(Zn(e,r),(r&130023424)===r&&(n=Ll+500-fe(),10<n)){if(qr(e,0)!==0)break;if(o=e.suspendedLanes,(o&r)!==r){Fe(),e.pingedLanes|=e.suspendedLanes&o;break}e.timeoutHandle=Wi(mt.bind(null,e,$e,zn),n);break}mt(e,$e,zn);break;case 4:if(Zn(e,r),(r&4194240)===r)break;for(n=e.eventTimes,o=-1;0<r;){var u=31-ln(r);i=1<<u,u=n[u],u>o&&(o=u),r&=~i}if(r=o,r=fe()-r,r=(120>r?120:480>r?480:1080>r?1080:1920>r?1920:3e3>r?3e3:4320>r?4320:1960*Sf(r/1960))-r,10<r){e.timeoutHandle=Wi(mt.bind(null,e,$e,zn),r);break}mt(e,$e,zn);break;case 5:mt(e,$e,zn);break;default:throw Error(a(329))}}}return Be(e,fe()),e.callbackNode===t?qs.bind(null,e):null}function Il(e,n){var t=zr;return e.current.memoizedState.isDehydrated&&(ht(e,n).flags|=256),e=Ho(e,n),e!==2&&(n=$e,$e=t,n!==null&&Hl(n)),e}function Hl(e){$e===null?$e=e:$e.push.apply($e,e)}function Pf(e){for(var n=e;;){if(n.flags&16384){var t=n.updateQueue;if(t!==null&&(t=t.stores,t!==null))for(var r=0;r<t.length;r++){var o=t[r],i=o.getSnapshot;o=o.value;try{if(!an(i(),o))return!1}catch{return!1}}}if(t=n.child,n.subtreeFlags&16384&&t!==null)t.return=n,n=t;else{if(n===e)break;for(;n.sibling===null;){if(n.return===null||n.return===e)return!0;n=n.return}n.sibling.return=n.return,n=n.sibling}}return!0}function Zn(e,n){for(n&=~Al,n&=~No,e.suspendedLanes|=n,e.pingedLanes&=~n,e=e.expirationTimes;0<n;){var t=31-ln(n),r=1<<t;e[t]=-1,n&=~r}}function Xs(e){if((Q&6)!==0)throw Error(a(327));Vt();var n=qr(e,0);if((n&1)===0)return Be(e,fe()),null;var t=Ho(e,n);if(e.tag!==0&&t===2){var r=yi(e);r!==0&&(n=r,t=Il(e,r))}if(t===1)throw t=Tr,ht(e,0),Zn(e,n),Be(e,fe()),t;if(t===6)throw Error(a(345));return e.finishedWork=e.current.alternate,e.finishedLanes=n,mt(e,$e,zn),Be(e,fe()),null}function Ul(e,n){var t=Q;Q|=1;try{return e(n)}finally{Q=t,Q===0&&(Bt=fe()+500,po&&Vn())}}function pt(e){Kn!==null&&Kn.tag===0&&(Q&6)===0&&Vt();var n=Q;Q|=1;var t=tn.transition,r=Z;try{if(tn.transition=null,Z=1,e)return e()}finally{Z=r,tn.transition=t,Q=n,(Q&6)===0&&Vn()}}function $l(){Ke=$t.current,re($t)}function ht(e,n){e.finishedWork=null,e.finishedLanes=0;var t=e.timeoutHandle;if(t!==-1&&(e.timeoutHandle=-1,Jd(t)),me!==null)for(t=me.return;t!==null;){var r=t;switch(Zi(r),r.tag){case 1:r=r.type.childContextTypes,r!=null&&co();break;case 3:It(),re(Ie),re(Re),cl();break;case 5:ul(r);break;case 4:It();break;case 13:re(ue);break;case 19:re(ue);break;case 10:rl(r.type._context);break;case 22:case 23:$l()}t=t.return}if(Se=e,me=e=Gn(e.current,null),Te=Ke=n,ge=0,Tr=null,Al=No=ft=0,$e=zr=null,st!==null){for(n=0;n<st.length;n++)if(t=st[n],r=t.interleaved,r!==null){t.interleaved=null;var o=r.next,i=t.pending;if(i!==null){var u=i.next;i.next=o,r.next=u}t.pending=r}st=null}return e}function Ks(e,n){do{var t=me;try{if(tl(),So.current=_o,Po){for(var r=se.memoizedState;r!==null;){var o=r.queue;o!==null&&(o.pending=null),r=r.next}Po=!1}if(dt=0,we=ve=se=null,Sr=!1,Pr=0,Nl.current=null,t===null||t.return===null){ge=1,Tr=n,me=null;break}e:{var i=e,u=t.return,d=t,f=n;if(n=Te,d.flags|=32768,f!==null&&typeof f=="object"&&typeof f.then=="function"){var b=f,P=d,O=P.tag;if((P.mode&1)===0&&(O===0||O===11||O===15)){var S=P.alternate;S?(P.updateQueue=S.updateQueue,P.memoizedState=S.memoizedState,P.lanes=S.lanes):(P.updateQueue=null,P.memoizedState=null)}var z=ks(u);if(z!==null){z.flags&=-257,xs(z,u,d,i,n),z.mode&1&&bs(i,b,n),n=z,f=b;var M=n.updateQueue;if(M===null){var R=new Set;R.add(f),n.updateQueue=R}else M.add(f);break e}else{if((n&1)===0){bs(i,b,n),Bl();break e}f=Error(a(426))}}else if(le&&d.mode&1){var pe=ks(u);if(pe!==null){(pe.flags&65536)===0&&(pe.flags|=256),xs(pe,u,d,i,n),el(Ht(f,d));break e}}i=f=Ht(f,d),ge!==4&&(ge=2),zr===null?zr=[i]:zr.push(i),i=u;do{switch(i.tag){case 3:i.flags|=65536,n&=-n,i.lanes|=n;var m=gs(i,f,n);Vu(i,m);break e;case 1:d=f;var p=i.type,g=i.stateNode;if((i.flags&128)===0&&(typeof p.getDerivedStateFromError=="function"||g!==null&&typeof g.componentDidCatch=="function"&&(Xn===null||!Xn.has(g)))){i.flags|=65536,n&=-n,i.lanes|=n;var E=ys(i,d,n);Vu(i,E);break e}}i=i.return}while(i!==null)}Gs(t)}catch(N){n=N,me===t&&t!==null&&(me=t=t.return);continue}break}while(!0)}function Ys(){var e=Ro.current;return Ro.current=_o,e===null?_o:e}function Bl(){(ge===0||ge===3||ge===2)&&(ge=4),Se===null||(ft&268435455)===0&&(No&268435455)===0||Zn(Se,Te)}function Ho(e,n){var t=Q;Q|=2;var r=Ys();(Se!==e||Te!==n)&&(zn=null,ht(e,n));do try{Of();break}catch(o){Ks(e,o)}while(!0);if(tl(),Q=t,Ro.current=r,me!==null)throw Error(a(261));return Se=null,Te=0,ge}function Of(){for(;me!==null;)Zs(me)}function Ef(){for(;me!==null&&!Yc();)Zs(me)}function Zs(e){var n=nc(e.alternate,e,Ke);e.memoizedProps=e.pendingProps,n===null?Gs(e):me=n,Nl.current=null}function Gs(e){var n=e;do{var t=n.alternate;if(e=n.return,(n.flags&32768)===0){if(t=yf(t,n,Ke),t!==null){me=t;return}}else{if(t=bf(t,n),t!==null){t.flags&=32767,me=t;return}if(e!==null)e.flags|=32768,e.subtreeFlags=0,e.deletions=null;else{ge=6,me=null;return}}if(n=n.sibling,n!==null){me=n;return}me=n=e}while(n!==null);ge===0&&(ge=5)}function mt(e,n,t){var r=Z,o=tn.transition;try{tn.transition=null,Z=1,_f(e,n,t,r)}finally{tn.transition=o,Z=r}return null}function _f(e,n,t,r){do Vt();while(Kn!==null);if((Q&6)!==0)throw Error(a(327));t=e.finishedWork;var o=e.finishedLanes;if(t===null)return null;if(e.finishedWork=null,e.finishedLanes=0,t===e.current)throw Error(a(177));e.callbackNode=null,e.callbackPriority=0;var i=t.lanes|t.childLanes;if(ld(e,i),e===Se&&(me=Se=null,Te=0),(t.subtreeFlags&2064)===0&&(t.flags&2064)===0||Lo||(Lo=!0,tc(Br,function(){return Vt(),null})),i=(t.flags&15990)!==0,(t.subtreeFlags&15990)!==0||i){i=tn.transition,tn.transition=null;var u=Z;Z=1;var d=Q;Q|=4,Nl.current=null,xf(e,t),$s(t,e),Qd(Bi),Yr=!!$i,Bi=$i=null,e.current=t,wf(t),Zc(),Q=d,Z=u,tn.transition=i}else e.current=t;if(Lo&&(Lo=!1,Kn=e,jo=o),i=e.pendingLanes,i===0&&(Xn=null),ed(t.stateNode),Be(e,fe()),n!==null)for(r=e.onRecoverableError,t=0;t<n.length;t++)o=n[t],r(o.value,{componentStack:o.stack,digest:o.digest});if(Ao)throw Ao=!1,e=jl,jl=null,e;return(jo&1)!==0&&e.tag!==0&&Vt(),i=e.pendingLanes,(i&1)!==0?e===Fl?Dr++:(Dr=0,Fl=e):Dr=0,Vn(),null}function Vt(){if(Kn!==null){var e=Ha(jo),n=tn.transition,t=Z;try{if(tn.transition=null,Z=16>e?16:e,Kn===null)var r=!1;else{if(e=Kn,Kn=null,jo=0,(Q&6)!==0)throw Error(a(331));var o=Q;for(Q|=4,D=e.current;D!==null;){var i=D,u=i.child;if((D.flags&16)!==0){var d=i.deletions;if(d!==null){for(var f=0;f<d.length;f++){var b=d[f];for(D=b;D!==null;){var P=D;switch(P.tag){case 0:case 11:case 15:Cr(8,P,i)}var O=P.child;if(O!==null)O.return=P,D=O;else for(;D!==null;){P=D;var S=P.sibling,z=P.return;if(js(P),P===b){D=null;break}if(S!==null){S.return=z,D=S;break}D=z}}}var M=i.alternate;if(M!==null){var R=M.child;if(R!==null){M.child=null;do{var pe=R.sibling;R.sibling=null,R=pe}while(R!==null)}}D=i}}if((i.subtreeFlags&2064)!==0&&u!==null)u.return=i,D=u;else e:for(;D!==null;){if(i=D,(i.flags&2048)!==0)switch(i.tag){case 0:case 11:case 15:Cr(9,i,i.return)}var m=i.sibling;if(m!==null){m.return=i.return,D=m;break e}D=i.return}}var p=e.current;for(D=p;D!==null;){u=D;var g=u.child;if((u.subtreeFlags&2064)!==0&&g!==null)g.return=u,D=g;else e:for(u=p;D!==null;){if(d=D,(d.flags&2048)!==0)try{switch(d.tag){case 0:case 11:case 15:Mo(9,d)}}catch(N){ce(d,d.return,N)}if(d===u){D=null;break e}var E=d.sibling;if(E!==null){E.return=d.return,D=E;break e}D=d.return}}if(Q=o,Vn(),gn&&typeof gn.onPostCommitFiberRoot=="function")try{gn.onPostCommitFiberRoot(Vr,e)}catch{}r=!0}return r}finally{Z=t,tn.transition=n}}return!1}function Js(e,n,t){n=Ht(t,n),n=gs(e,n,1),e=Qn(e,n,1),n=Fe(),e!==null&&(nr(e,1,n),Be(e,n))}function ce(e,n,t){if(e.tag===3)Js(e,e,t);else for(;n!==null;){if(n.tag===3){Js(n,e,t);break}else if(n.tag===1){var r=n.stateNode;if(typeof n.type.getDerivedStateFromError=="function"||typeof r.componentDidCatch=="function"&&(Xn===null||!Xn.has(r))){e=Ht(t,e),e=ys(n,e,1),n=Qn(n,e,1),e=Fe(),n!==null&&(nr(n,1,e),Be(n,e));break}}n=n.return}}function Cf(e,n,t){var r=e.pingCache;r!==null&&r.delete(n),n=Fe(),e.pingedLanes|=e.suspendedLanes&t,Se===e&&(Te&t)===t&&(ge===4||ge===3&&(Te&130023424)===Te&&500>fe()-Ll?ht(e,0):Al|=t),Be(e,n)}function ec(e,n){n===0&&((e.mode&1)===0?n=1:(n=Qr,Qr<<=1,(Qr&130023424)===0&&(Qr=4194304)));var t=Fe();e=_n(e,n),e!==null&&(nr(e,n,t),Be(e,t))}function Tf(e){var n=e.memoizedState,t=0;n!==null&&(t=n.retryLane),ec(e,t)}function zf(e,n){var t=0;switch(e.tag){case 13:var r=e.stateNode,o=e.memoizedState;o!==null&&(t=o.retryLane);break;case 19:r=e.stateNode;break;default:throw Error(a(314))}r!==null&&r.delete(n),ec(e,t)}var nc;nc=function(e,n,t){if(e!==null)if(e.memoizedProps!==n.pendingProps||Ie.current)Ue=!0;else{if((e.lanes&t)===0&&(n.flags&128)===0)return Ue=!1,gf(e,n,t);Ue=(e.flags&131072)!==0}else Ue=!1,le&&(n.flags&1048576)!==0&&Nu(n,mo,n.index);switch(n.lanes=0,n.tag){case 2:var r=n.type;zo(e,n),e=n.pendingProps;var o=Mt(n,Re.current);Ft(n,t),o=pl(null,n,r,e,o,t);var i=hl();return n.flags|=1,typeof o=="object"&&o!==null&&typeof o.render=="function"&&o.$$typeof===void 0?(n.tag=1,n.memoizedState=null,n.updateQueue=null,He(r)?(i=!0,fo(n)):i=!1,n.memoizedState=o.state!==null&&o.state!==void 0?o.state:null,ll(n),o.updater=Co,n.stateNode=o,o._reactInternals=n,kl(n,r,e,t),n=Pl(null,n,r,!0,i,t)):(n.tag=0,le&&i&&Yi(n),je(null,n,o,t),n=n.child),n;case 16:r=n.elementType;e:{switch(zo(e,n),e=n.pendingProps,o=r._init,r=o(r._payload),n.type=r,o=n.tag=Mf(r),e=sn(r,e),o){case 0:n=Sl(null,n,r,e,t);break e;case 1:n=_s(null,n,r,e,t);break e;case 11:n=ws(null,n,r,e,t);break e;case 14:n=Ss(null,n,r,sn(r.type,e),t);break e}throw Error(a(306,r,""))}return n;case 0:return r=n.type,o=n.pendingProps,o=n.elementType===r?o:sn(r,o),Sl(e,n,r,o,t);case 1:return r=n.type,o=n.pendingProps,o=n.elementType===r?o:sn(r,o),_s(e,n,r,o,t);case 3:e:{if(Cs(n),e===null)throw Error(a(387));r=n.pendingProps,i=n.memoizedState,o=i.element,Bu(e,n),xo(n,r,null,t);var u=n.memoizedState;if(r=u.element,i.isDehydrated)if(i={element:r,isDehydrated:!1,cache:u.cache,pendingSuspenseBoundaries:u.pendingSuspenseBoundaries,transitions:u.transitions},n.updateQueue.baseState=i,n.memoizedState=i,n.flags&256){o=Ht(Error(a(423)),n),n=Ts(e,n,r,t,o);break e}else if(r!==o){o=Ht(Error(a(424)),n),n=Ts(e,n,r,t,o);break e}else for(Xe=Un(n.stateNode.containerInfo.firstChild),qe=n,le=!0,un=null,t=Uu(n,null,r,t),n.child=t;t;)t.flags=t.flags&-3|4096,t=t.sibling;else{if(At(),r===o){n=Tn(e,n,t);break e}je(e,n,r,t)}n=n.child}return n;case 5:return Qu(n),e===null&&Ji(n),r=n.type,o=n.pendingProps,i=e!==null?e.memoizedProps:null,u=o.children,Vi(r,o)?u=null:i!==null&&Vi(r,i)&&(n.flags|=32),Es(e,n),je(e,n,u,t),n.child;case 6:return e===null&&Ji(n),null;case 13:return zs(e,n,t);case 4:return al(n,n.stateNode.containerInfo),r=n.pendingProps,e===null?n.child=Lt(n,null,r,t):je(e,n,r,t),n.child;case 11:return r=n.type,o=n.pendingProps,o=n.elementType===r?o:sn(r,o),ws(e,n,r,o,t);case 7:return je(e,n,n.pendingProps,t),n.child;case 8:return je(e,n,n.pendingProps.children,t),n.child;case 12:return je(e,n,n.pendingProps.children,t),n.child;case 10:e:{if(r=n.type._context,o=n.pendingProps,i=n.memoizedProps,u=o.value,ne(yo,r._currentValue),r._currentValue=u,i!==null)if(an(i.value,u)){if(i.children===o.children&&!Ie.current){n=Tn(e,n,t);break e}}else for(i=n.child,i!==null&&(i.return=n);i!==null;){var d=i.dependencies;if(d!==null){u=i.child;for(var f=d.firstContext;f!==null;){if(f.context===r){if(i.tag===1){f=Cn(-1,t&-t),f.tag=2;var b=i.updateQueue;if(b!==null){b=b.shared;var P=b.pending;P===null?f.next=f:(f.next=P.next,P.next=f),b.pending=f}}i.lanes|=t,f=i.alternate,f!==null&&(f.lanes|=t),ol(i.return,t,n),d.lanes|=t;break}f=f.next}}else if(i.tag===10)u=i.type===n.type?null:i.child;else if(i.tag===18){if(u=i.return,u===null)throw Error(a(341));u.lanes|=t,d=u.alternate,d!==null&&(d.lanes|=t),ol(u,t,n),u=i.sibling}else u=i.child;if(u!==null)u.return=i;else for(u=i;u!==null;){if(u===n){u=null;break}if(i=u.sibling,i!==null){i.return=u.return,u=i;break}u=u.return}i=u}je(e,n,o.children,t),n=n.child}return n;case 9:return o=n.type,r=n.pendingProps.children,Ft(n,t),o=en(o),r=r(o),n.flags|=1,je(e,n,r,t),n.child;case 14:return r=n.type,o=sn(r,n.pendingProps),o=sn(r.type,o),Ss(e,n,r,o,t);case 15:return Ps(e,n,n.type,n.pendingProps,t);case 17:return r=n.type,o=n.pendingProps,o=n.elementType===r?o:sn(r,o),zo(e,n),n.tag=1,He(r)?(e=!0,fo(n)):e=!1,Ft(n,t),ms(n,r,o),kl(n,r,o,t),Pl(null,n,r,!0,e,t);case 19:return Ms(e,n,t);case 22:return Os(e,n,t)}throw Error(a(156,n.tag))};function tc(e,n){return Aa(e,n)}function Df(e,n,t,r){this.tag=e,this.key=t,this.sibling=this.child=this.return=this.stateNode=this.type=this.elementType=null,this.index=0,this.ref=null,this.pendingProps=n,this.dependencies=this.memoizedState=this.updateQueue=this.memoizedProps=null,this.mode=r,this.subtreeFlags=this.flags=0,this.deletions=null,this.childLanes=this.lanes=0,this.alternate=null}function rn(e,n,t,r){return new Df(e,n,t,r)}function Vl(e){return e=e.prototype,!(!e||!e.isReactComponent)}function Mf(e){if(typeof e=="function")return Vl(e)?1:0;if(e!=null){if(e=e.$$typeof,e===bt)return 11;if(e===Nn)return 14}return 2}function Gn(e,n){var t=e.alternate;return t===null?(t=rn(e.tag,n,e.key,e.mode),t.elementType=e.elementType,t.type=e.type,t.stateNode=e.stateNode,t.alternate=e,e.alternate=t):(t.pendingProps=n,t.type=e.type,t.flags=0,t.subtreeFlags=0,t.deletions=null),t.flags=e.flags&14680064,t.childLanes=e.childLanes,t.lanes=e.lanes,t.child=e.child,t.memoizedProps=e.memoizedProps,t.memoizedState=e.memoizedState,t.updateQueue=e.updateQueue,n=e.dependencies,t.dependencies=n===null?null:{lanes:n.lanes,firstContext:n.firstContext},t.sibling=e.sibling,t.index=e.index,t.ref=e.ref,t}function Uo(e,n,t,r,o,i){var u=2;if(r=e,typeof e=="function")Vl(e)&&(u=1);else if(typeof e=="string")u=5;else e:switch(e){case Ee:return vt(t.children,o,i,n);case Ze:u=8,o|=8;break;case _e:return e=rn(12,t,n,o|2),e.elementType=_e,e.lanes=i,e;case nt:return e=rn(13,t,n,o),e.elementType=nt,e.lanes=i,e;case Rn:return e=rn(19,t,n,o),e.elementType=Rn,e.lanes=i,e;case xe:return $o(t,o,i,n);default:if(typeof e=="object"&&e!==null)switch(e.$$typeof){case yt:u=10;break e;case jr:u=9;break e;case bt:u=11;break e;case Nn:u=14;break e;case vn:u=16,r=null;break e}throw Error(a(130,e==null?e:typeof e,""))}return n=rn(u,t,n,o),n.elementType=e,n.type=r,n.lanes=i,n}function vt(e,n,t,r){return e=rn(7,e,r,n),e.lanes=t,e}function $o(e,n,t,r){return e=rn(22,e,r,n),e.elementType=xe,e.lanes=t,e.stateNode={isHidden:!1},e}function Wl(e,n,t){return e=rn(6,e,null,n),e.lanes=t,e}function Ql(e,n,t){return n=rn(4,e.children!==null?e.children:[],e.key,n),n.lanes=t,n.stateNode={containerInfo:e.containerInfo,pendingChildren:null,implementation:e.implementation},n}function Rf(e,n,t,r,o){this.tag=n,this.containerInfo=e,this.finishedWork=this.pingCache=this.current=this.pendingChildren=null,this.timeoutHandle=-1,this.callbackNode=this.pendingContext=this.context=null,this.callbackPriority=0,this.eventTimes=bi(0),this.expirationTimes=bi(-1),this.entangledLanes=this.finishedLanes=this.mutableReadLanes=this.expiredLanes=this.pingedLanes=this.suspendedLanes=this.pendingLanes=0,this.entanglements=bi(0),this.identifierPrefix=r,this.onRecoverableError=o,this.mutableSourceEagerHydrationData=null}function ql(e,n,t,r,o,i,u,d,f){return e=new Rf(e,n,t,d,f),n===1?(n=1,i===!0&&(n|=8)):n=0,i=rn(3,null,null,n),e.current=i,i.stateNode=e,i.memoizedState={element:r,isDehydrated:t,cache:null,transitions:null,pendingSuspenseBoundaries:null},ll(i),e}function Nf(e,n,t){var r=3<arguments.length&&arguments[3]!==void 0?arguments[3]:null;return{$$typeof:ke,key:r==null?null:""+r,children:e,containerInfo:n,implementation:t}}function rc(e){if(!e)return Bn;e=e._reactInternals;e:{if(ot(e)!==e||e.tag!==1)throw Error(a(170));var n=e;do{switch(n.tag){case 3:n=n.stateNode.context;break e;case 1:if(He(n.type)){n=n.stateNode.__reactInternalMemoizedMergedChildContext;break e}}n=n.return}while(n!==null);throw Error(a(171))}if(e.tag===1){var t=e.type;if(He(t))return Du(e,t,n)}return n}function oc(e,n,t,r,o,i,u,d,f){return e=ql(t,r,!0,e,o,i,u,d,f),e.context=rc(null),t=e.current,r=Fe(),o=Yn(t),i=Cn(r,o),i.callback=n??null,Qn(t,i,o),e.current.lanes=o,nr(e,o,r),Be(e,r),e}function Bo(e,n,t,r){var o=n.current,i=Fe(),u=Yn(o);return t=rc(t),n.context===null?n.context=t:n.pendingContext=t,n=Cn(i,u),n.payload={element:e},r=r===void 0?null:r,r!==null&&(n.callback=r),e=Qn(o,n,u),e!==null&&(fn(e,o,u,i),ko(e,o,u)),u}function Vo(e){if(e=e.current,!e.child)return null;switch(e.child.tag){case 5:return e.child.stateNode;default:return e.child.stateNode}}function ic(e,n){if(e=e.memoizedState,e!==null&&e.dehydrated!==null){var t=e.retryLane;e.retryLane=t!==0&&t<n?t:n}}function Xl(e,n){ic(e,n),(e=e.alternate)&&ic(e,n)}function Af(){return null}var lc=typeof reportError=="function"?reportError:function(e){console.error(e)};function Kl(e){this._internalRoot=e}Wo.prototype.render=Kl.prototype.render=function(e){var n=this._internalRoot;if(n===null)throw Error(a(409));Bo(e,n,null,null)},Wo.prototype.unmount=Kl.prototype.unmount=function(){var e=this._internalRoot;if(e!==null){this._internalRoot=null;var n=e.containerInfo;pt(function(){Bo(null,e,null,null)}),n[Sn]=null}};function Wo(e){this._internalRoot=e}Wo.prototype.unstable_scheduleHydration=function(e){if(e){var n=Ba();e={blockedOn:null,target:e,priority:n};for(var t=0;t<Fn.length&&n!==0&&n<Fn[t].priority;t++);Fn.splice(t,0,e),t===0&&Qa(e)}};function Yl(e){return!(!e||e.nodeType!==1&&e.nodeType!==9&&e.nodeType!==11)}function Qo(e){return!(!e||e.nodeType!==1&&e.nodeType!==9&&e.nodeType!==11&&(e.nodeType!==8||e.nodeValue!==" react-mount-point-unstable "))}function ac(){}function Lf(e,n,t,r,o){if(o){if(typeof r=="function"){var i=r;r=function(){var b=Vo(u);i.call(b)}}var u=oc(n,r,e,0,null,!1,!1,"",ac);return e._reactRootContainer=u,e[Sn]=u.current,mr(e.nodeType===8?e.parentNode:e),pt(),u}for(;o=e.lastChild;)e.removeChild(o);if(typeof r=="function"){var d=r;r=function(){var b=Vo(f);d.call(b)}}var f=ql(e,0,!1,null,null,!1,!1,"",ac);return e._reactRootContainer=f,e[Sn]=f.current,mr(e.nodeType===8?e.parentNode:e),pt(function(){Bo(n,f,t,r)}),f}function qo(e,n,t,r,o){var i=t._reactRootContainer;if(i){var u=i;if(typeof o=="function"){var d=o;o=function(){var f=Vo(u);d.call(f)}}Bo(n,u,e,o)}else u=Lf(t,n,e,o,r);return Vo(u)}Ua=function(e){switch(e.tag){case 3:var n=e.stateNode;if(n.current.memoizedState.isDehydrated){var t=er(n.pendingLanes);t!==0&&(ki(n,t|1),Be(n,fe()),(Q&6)===0&&(Bt=fe()+500,Vn()))}break;case 13:pt(function(){var r=_n(e,1);if(r!==null){var o=Fe();fn(r,e,1,o)}}),Xl(e,1)}},xi=function(e){if(e.tag===13){var n=_n(e,134217728);if(n!==null){var t=Fe();fn(n,e,134217728,t)}Xl(e,134217728)}},$a=function(e){if(e.tag===13){var n=Yn(e),t=_n(e,n);if(t!==null){var r=Fe();fn(t,e,n,r)}Xl(e,n)}},Ba=function(){return Z},Va=function(e,n){var t=Z;try{return Z=e,n()}finally{Z=t}},pi=function(e,n,t){switch(n){case"input":if(ii(e,t),n=t.name,t.type==="radio"&&n!=null){for(t=e;t.parentNode;)t=t.parentNode;for(t=t.querySelectorAll("input[name="+JSON.stringify(""+n)+'][type="radio"]'),n=0;n<t.length;n++){var r=t[n];if(r!==e&&r.form===e.form){var o=so(r);if(!o)throw Error(a(90));ha(r),ii(r,o)}}}break;case"textarea":ba(e,t);break;case"select":n=t.value,n!=null&&kt(e,!!t.multiple,n,!1)}},Ca=Ul,Ta=pt;var jf={usingClientEntryPoint:!1,Events:[yr,zt,so,Ea,_a,Ul]},Mr={findFiberByHostInstance:it,bundleType:0,version:"18.3.1",rendererPackageName:"react-dom"},Ff={bundleType:Mr.bundleType,version:Mr.version,rendererPackageName:Mr.rendererPackageName,rendererConfig:Mr.rendererConfig,overrideHookState:null,overrideHookStateDeletePath:null,overrideHookStateRenamePath:null,overrideProps:null,overridePropsDeletePath:null,overridePropsRenamePath:null,setErrorHandler:null,setSuspenseHandler:null,scheduleUpdate:null,currentDispatcherRef:he.ReactCurrentDispatcher,findHostInstanceByFiber:function(e){return e=Ra(e),e===null?null:e.stateNode},findFiberByHostInstance:Mr.findFiberByHostInstance||Af,findHostInstancesForRefresh:null,scheduleRefresh:null,scheduleRoot:null,setRefreshHandler:null,getCurrentFiber:null,reconcilerVersion:"18.3.1-next-f1338f8080-20240426"};if(typeof __REACT_DEVTOOLS_GLOBAL_HOOK__<"u"){var Xo=__REACT_DEVTOOLS_GLOBAL_HOOK__;if(!Xo.isDisabled&&Xo.supportsFiber)try{Vr=Xo.inject(Ff),gn=Xo}catch{}}return Ve.__SECRET_INTERNALS_DO_NOT_USE_OR_YOU_WILL_BE_FIRED=jf,Ve.createPortal=function(e,n){var t=2<arguments.length&&arguments[2]!==void 0?arguments[2]:null;if(!Yl(n))throw Error(a(200));return Nf(e,n,null,t)},Ve.createRoot=function(e,n){if(!Yl(e))throw Error(a(299));var t=!1,r="",o=lc;return n!=null&&(n.unstable_strictMode===!0&&(t=!0),n.identifierPrefix!==void 0&&(r=n.identifierPrefix),n.onRecoverableError!==void 0&&(o=n.onRecoverableError)),n=ql(e,1,!1,null,null,t,!1,r,o),e[Sn]=n.current,mr(e.nodeType===8?e.parentNode:e),new Kl(n)},Ve.findDOMNode=function(e){if(e==null)return null;if(e.nodeType===1)return e;var n=e._reactInternals;if(n===void 0)throw typeof e.render=="function"?Error(a(188)):(e=Object.keys(e).join(","),Error(a(268,e)));return e=Ra(n),e=e===null?null:e.stateNode,e},Ve.flushSync=function(e){return pt(e)},Ve.hydrate=function(e,n,t){if(!Qo(n))throw Error(a(200));return qo(null,e,n,!0,t)},Ve.hydrateRoot=function(e,n,t){if(!Yl(e))throw Error(a(405));var r=t!=null&&t.hydratedSources||null,o=!1,i="",u=lc;if(t!=null&&(t.unstable_strictMode===!0&&(o=!0),t.identifierPrefix!==void 0&&(i=t.identifierPrefix),t.onRecoverableError!==void 0&&(u=t.onRecoverableError)),n=oc(n,null,e,1,t??null,o,!1,i,u),e[Sn]=n.current,mr(e),r)for(e=0;e<r.length;e++)t=r[e],o=t._getVersion,o=o(t._source),n.mutableSourceEagerHydrationData==null?n.mutableSourceEagerHydrationData=[t,o]:n.mutableSourceEagerHydrationData.push(t,o);return new Wo(n)},Ve.render=function(e,n,t){if(!Qo(n))throw Error(a(200));return qo(null,e,n,!1,t)},Ve.unmountComponentAtNode=function(e){if(!Qo(e))throw Error(a(40));return e._reactRootContainer?(pt(function(){qo(null,null,e,!1,function(){e._reactRootContainer=null,e[Sn]=null})}),!0):!1},Ve.unstable_batchedUpdates=Ul,Ve.unstable_renderSubtreeIntoContainer=function(e,n,t,r){if(!Qo(t))throw Error(a(200));if(e==null||e._reactInternals===void 0)throw Error(a(38));return qo(e,n,t,!1,r)},Ve.version="18.3.1-next-f1338f8080-20240426",Ve}var mc;function Dc(){if(mc)return Jl.exports;mc=1;function l(){if(!(typeof __REACT_DEVTOOLS_GLOBAL_HOOK__>"u"||typeof __REACT_DEVTOOLS_GLOBAL_HOOK__.checkDCE!="function"))try{__REACT_DEVTOOLS_GLOBAL_HOOK__.checkDCE(l)}catch(s){console.error(s)}}return l(),Jl.exports=qf(),Jl.exports}var vc;function Xf(){if(vc)return Ko;vc=1;var l=Dc();return Ko.createRoot=l.createRoot,Ko.hydrateRoot=l.hydrateRoot,Ko}var Kf=Xf();const Jp=ti(Kf);var ea,gc;function Yf(){if(gc)return ea;gc=1;var l=typeof Element<"u",s=typeof Map=="function",a=typeof Set=="function",c=typeof ArrayBuffer=="function"&&!!ArrayBuffer.isView;function h(v,k){if(v===k)return!0;if(v&&k&&typeof v=="object"&&typeof k=="object"){if(v.constructor!==k.constructor)return!1;var w,x,_;if(Array.isArray(v)){if(w=v.length,w!=k.length)return!1;for(x=w;x--!==0;)if(!h(v[x],k[x]))return!1;return!0}var A;if(s&&v instanceof Map&&k instanceof Map){if(v.size!==k.size)return!1;for(A=v.entries();!(x=A.next()).done;)if(!k.has(x.value[0]))return!1;for(A=v.entries();!(x=A.next()).done;)if(!h(x.value[1],k.get(x.value[0])))return!1;return!0}if(a&&v instanceof Set&&k instanceof Set){if(v.size!==k.size)return!1;for(A=v.entries();!(x=A.next()).done;)if(!k.has(x.value[0]))return!1;return!0}if(c&&ArrayBuffer.isView(v)&&ArrayBuffer.isView(k)){if(w=v.length,w!=k.length)return!1;for(x=w;x--!==0;)if(v[x]!==k[x])return!1;return!0}if(v.constructor===RegExp)return v.source===k.source&&v.flags===k.flags;if(v.valueOf!==Object.prototype.valueOf&&typeof v.valueOf=="function"&&typeof k.valueOf=="function")return v.valueOf()===k.valueOf();if(v.toString!==Object.prototype.toString&&typeof v.toString=="function"&&typeof k.toString=="function")return v.toString()===k.toString();if(_=Object.keys(v),w=_.length,w!==Object.keys(k).length)return!1;for(x=w;x--!==0;)if(!Object.prototype.hasOwnProperty.call(k,_[x]))return!1;if(l&&v instanceof Element)return!1;for(x=w;x--!==0;)if(!((_[x]==="_owner"||_[x]==="__v"||_[x]==="__o")&&v.$$typeof)&&!h(v[_[x]],k[_[x]]))return!1;return!0}return v!==v&&k!==k}return ea=function(k,w){try{return h(k,w)}catch(x){if((x.message||"").match(/stack|recursion/i))return console.warn("react-fast-compare cannot handle circular refs"),!1;throw x}},ea}var Zf=Yf();const Gf=ti(Zf);var Mc=(l=>(l.BASE="base",l.BODY="body",l.HEAD="head",l.HTML="html",l.LINK="link",l.META="meta",l.NOSCRIPT="noscript",l.SCRIPT="script",l.STYLE="style",l.TITLE="title",l.FRAGMENT="Symbol(react.fragment)",l))(Mc||{}),na={link:{rel:["amphtml","canonical","alternate"]},script:{type:["application/ld+json"]},meta:{charset:"",name:["generator","robots","description"],property:["og:type","og:title","og:url","og:image","og:image:alt","og:description","twitter:url","twitter:title","twitter:description","twitter:image","twitter:image:alt","twitter:card","twitter:site"]}},yc=Object.values(Mc),fa={accesskey:"accessKey",charset:"charSet",class:"className",contenteditable:"contentEditable",contextmenu:"contextMenu","http-equiv":"httpEquiv",itemprop:"itemProp",tabindex:"tabIndex"},Jf=Object.entries(fa).reduce((l,[s,a])=>(l[a]=s,l),{}),hn="data-rh",Qt={DEFAULT_TITLE:"defaultTitle",DEFER:"defer",ENCODE_SPECIAL_CHARACTERS:"encodeSpecialCharacters",ON_CHANGE_CLIENT_STATE:"onChangeClientState",TITLE_TEMPLATE:"titleTemplate",PRIORITIZE_SEO_TAGS:"prioritizeSeoTags"},qt=(l,s)=>{for(let a=l.length-1;a>=0;a-=1){const c=l[a];if(Object.prototype.hasOwnProperty.call(c,s))return c[s]}return null},ep=l=>{let s=qt(l,"title");const a=qt(l,Qt.TITLE_TEMPLATE);if(Array.isArray(s)&&(s=s.join("")),a&&s)return a.replace(/%s/g,()=>s);const c=qt(l,Qt.DEFAULT_TITLE);return s||c||void 0},np=l=>qt(l,Qt.ON_CHANGE_CLIENT_STATE)||(()=>{}),ta=(l,s)=>s.filter(a=>typeof a[l]<"u").map(a=>a[l]).reduce((a,c)=>({...a,...c}),{}),tp=(l,s)=>s.filter(a=>typeof a.base<"u").map(a=>a.base).reverse().reduce((a,c)=>{if(!a.length){const h=Object.keys(c);for(let v=0;v<h.length;v+=1){const w=h[v].toLowerCase();if(l.indexOf(w)!==-1&&c[w])return a.concat(c)}}return a},[]),rp=l=>console&&typeof console.warn=="function"&&console.warn(l),Nr=(l,s,a)=>{const c={};return a.filter(h=>Array.isArray(h[l])?!0:(typeof h[l]<"u"&&rp(`Helmet: ${l} should be of type "Array". Instead found type "${typeof h[l]}"`),!1)).map(h=>h[l]).reverse().reduce((h,v)=>{const k={};v.filter(x=>{let _;const A=Object.keys(x);for(let W=0;W<A.length;W+=1){const J=A[W],U=J.toLowerCase();s.indexOf(U)!==-1&&!(_==="rel"&&x[_].toLowerCase()==="canonical")&&!(U==="rel"&&x[U].toLowerCase()==="stylesheet")&&(_=U),s.indexOf(J)!==-1&&(J==="innerHTML"||J==="cssText"||J==="itemprop")&&(_=J)}if(!_||!x[_])return!1;const X=x[_].toLowerCase();return c[_]||(c[_]={}),k[_]||(k[_]={}),c[_][X]?!1:(k[_][X]=!0,!0)}).reverse().forEach(x=>h.push(x));const w=Object.keys(k);for(let x=0;x<w.length;x+=1){const _=w[x],A={...c[_],...k[_]};c[_]=A}return h},[]).reverse()},op=(l,s)=>{if(Array.isArray(l)&&l.length){for(let a=0;a<l.length;a+=1)if(l[a][s])return!0}return!1},ip=l=>({baseTag:tp(["href"],l),bodyAttributes:ta("bodyAttributes",l),defer:qt(l,Qt.DEFER),encode:qt(l,Qt.ENCODE_SPECIAL_CHARACTERS),htmlAttributes:ta("htmlAttributes",l),linkTags:Nr("link",["rel","href"],l),metaTags:Nr("meta",["name","charset","http-equiv","property","itemprop"],l),noscriptTags:Nr("noscript",["innerHTML"],l),onChangeClientState:np(l),scriptTags:Nr("script",["src","innerHTML"],l),styleTags:Nr("style",["cssText"],l),title:ep(l),titleAttributes:ta("titleAttributes",l),prioritizeSeoTags:op(l,Qt.PRIORITIZE_SEO_TAGS)}),Rc=l=>Array.isArray(l)?l.join(""):l,lp=(l,s)=>{const a=Object.keys(l);for(let c=0;c<a.length;c+=1)if(s[a[c]]&&s[a[c]].includes(l[a[c]]))return!0;return!1},ra=(l,s)=>Array.isArray(l)?l.reduce((a,c)=>(lp(c,s)?a.priority.push(c):a.default.push(c),a),{priority:[],default:[]}):{default:l,priority:[]},bc=(l,s)=>({...l,[s]:void 0}),ap=["noscript","script","style"],la=(l,s=!0)=>s===!1?String(l):String(l).replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;").replace(/"/g,"&quot;").replace(/'/g,"&#x27;"),Nc=l=>Object.keys(l).reduce((s,a)=>{const c=typeof l[a]<"u"?`${a}="${l[a]}"`:`${a}`;return s?`${s} ${c}`:c},""),up=(l,s,a,c)=>{const h=Nc(a),v=Rc(s);return h?`<${l} ${hn}="true" ${h}>${la(v,c)}</${l}>`:`<${l} ${hn}="true">${la(v,c)}</${l}>`},sp=(l,s,a=!0)=>s.reduce((c,h)=>{const v=h,k=Object.keys(v).filter(_=>!(_==="innerHTML"||_==="cssText")).reduce((_,A)=>{const X=typeof v[A]>"u"?A:`${A}="${la(v[A],a)}"`;return _?`${_} ${X}`:X},""),w=v.innerHTML||v.cssText||"",x=ap.indexOf(l)===-1;return`${c}<${l} ${hn}="true" ${k}${x?"/>":`>${w}</${l}>`}`},""),Ac=(l,s={})=>Object.keys(l).reduce((a,c)=>{const h=fa[c];return a[h||c]=l[c],a},s),cp=(l,s,a)=>{const c={key:s,[hn]:!0},h=Ac(a,c);return[Oe.createElement("title",h,s)]},ei=(l,s)=>s.map((a,c)=>{const h={key:c,[hn]:!0};return Object.keys(a).forEach(v=>{const w=fa[v]||v;if(w==="innerHTML"||w==="cssText"){const x=a.innerHTML||a.cssText;h.dangerouslySetInnerHTML={__html:x}}else h[w]=a[v]}),Oe.createElement(l,h)}),on=(l,s,a=!0)=>{switch(l){case"title":return{toComponent:()=>cp(l,s.title,s.titleAttributes),toString:()=>up(l,s.title,s.titleAttributes,a)};case"bodyAttributes":case"htmlAttributes":return{toComponent:()=>Ac(s),toString:()=>Nc(s)};default:return{toComponent:()=>ei(l,s),toString:()=>sp(l,s,a)}}},dp=({metaTags:l,linkTags:s,scriptTags:a,encode:c})=>{const h=ra(l,na.meta),v=ra(s,na.link),k=ra(a,na.script);return{priorityMethods:{toComponent:()=>[...ei("meta",h.priority),...ei("link",v.priority),...ei("script",k.priority)],toString:()=>`${on("meta",h.priority,c)} ${on("link",v.priority,c)} ${on("script",k.priority,c)}`},metaTags:h.default,linkTags:v.default,scriptTags:k.default}},fp=l=>{const{baseTag:s,bodyAttributes:a,encode:c=!0,htmlAttributes:h,noscriptTags:v,styleTags:k,title:w="",titleAttributes:x,prioritizeSeoTags:_}=l;let{linkTags:A,metaTags:X,scriptTags:W}=l,J={toComponent:()=>{},toString:()=>""};return _&&({priorityMethods:J,linkTags:A,metaTags:X,scriptTags:W}=dp(l)),{priority:J,base:on("base",s,c),bodyAttributes:on("bodyAttributes",a,c),htmlAttributes:on("htmlAttributes",h,c),link:on("link",A,c),meta:on("meta",X,c),noscript:on("noscript",v,c),script:on("script",W,c),style:on("style",k,c),title:on("title",{title:w,titleAttributes:x},c)}},aa=fp,Yo=[],Lc=!!(typeof window<"u"&&window.document&&window.document.createElement),ua=class{constructor(l,s){Dn(this,"instances",[]);Dn(this,"canUseDOM",Lc);Dn(this,"context");Dn(this,"value",{setHelmet:l=>{this.context.helmet=l},helmetInstances:{get:()=>this.canUseDOM?Yo:this.instances,add:l=>{(this.canUseDOM?Yo:this.instances).push(l)},remove:l=>{const s=(this.canUseDOM?Yo:this.instances).indexOf(l);(this.canUseDOM?Yo:this.instances).splice(s,1)}}});this.context=l,this.canUseDOM=s||!1,s||(l.helmet=aa({baseTag:[],bodyAttributes:{},htmlAttributes:{},linkTags:[],metaTags:[],noscriptTags:[],scriptTags:[],styleTags:[],title:"",titleAttributes:{}}))}},pp={},jc=Oe.createContext(pp),gt,hp=(gt=class extends B.Component{constructor(a){super(a);Dn(this,"helmetData");this.helmetData=new ua(this.props.context||{},gt.canUseDOM)}render(){return Oe.createElement(jc.Provider,{value:this.helmetData.value},this.props.children)}},Dn(gt,"canUseDOM",Lc),gt),Wt=(l,s)=>{const a=document.head||document.querySelector("head"),c=a.querySelectorAll(`${l}[${hn}]`),h=[].slice.call(c),v=[];let k;return s&&s.length&&s.forEach(w=>{const x=document.createElement(l);for(const _ in w)if(Object.prototype.hasOwnProperty.call(w,_))if(_==="innerHTML")x.innerHTML=w.innerHTML;else if(_==="cssText")x.styleSheet?x.styleSheet.cssText=w.cssText:x.appendChild(document.createTextNode(w.cssText));else{const A=_,X=typeof w[A]>"u"?"":w[A];x.setAttribute(_,X)}x.setAttribute(hn,"true"),h.some((_,A)=>(k=A,x.isEqualNode(_)))?h.splice(k,1):v.push(x)}),h.forEach(w=>{var x;return(x=w.parentNode)==null?void 0:x.removeChild(w)}),v.forEach(w=>a.appendChild(w)),{oldTags:h,newTags:v}},sa=(l,s)=>{const a=document.getElementsByTagName(l)[0];if(!a)return;const c=a.getAttribute(hn),h=c?c.split(","):[],v=[...h],k=Object.keys(s);for(const w of k){const x=s[w]||"";a.getAttribute(w)!==x&&a.setAttribute(w,x),h.indexOf(w)===-1&&h.push(w);const _=v.indexOf(w);_!==-1&&v.splice(_,1)}for(let w=v.length-1;w>=0;w-=1)a.removeAttribute(v[w]);h.length===v.length?a.removeAttribute(hn):a.getAttribute(hn)!==k.join(",")&&a.setAttribute(hn,k.join(","))},mp=(l,s)=>{typeof l<"u"&&document.title!==l&&(document.title=Rc(l)),sa("title",s)},kc=(l,s)=>{const{baseTag:a,bodyAttributes:c,htmlAttributes:h,linkTags:v,metaTags:k,noscriptTags:w,onChangeClientState:x,scriptTags:_,styleTags:A,title:X,titleAttributes:W}=l;sa("body",c),sa("html",h),mp(X,W);const J={baseTag:Wt("base",a),linkTags:Wt("link",v),metaTags:Wt("meta",k),noscriptTags:Wt("noscript",w),scriptTags:Wt("script",_),styleTags:Wt("style",A)},U={},C={};Object.keys(J).forEach(j=>{const{newTags:ze,oldTags:De}=J[j];ze.length&&(U[j]=ze),De.length&&(C[j]=J[j].oldTags)}),s&&s(),x(l,U,C)},Ar=null,vp=l=>{Ar&&cancelAnimationFrame(Ar),l.defer?Ar=requestAnimationFrame(()=>{kc(l,()=>{Ar=null})}):(kc(l),Ar=null)},gp=vp,xc=class extends B.Component{constructor(){super(...arguments);Dn(this,"rendered",!1)}shouldComponentUpdate(s){return!Bf(s,this.props)}componentDidUpdate(){this.emitChange()}componentWillUnmount(){const{helmetInstances:s}=this.props.context;s.remove(this),this.emitChange()}emitChange(){const{helmetInstances:s,setHelmet:a}=this.props.context;let c=null;const h=ip(s.get().map(v=>{const k={...v.props};return delete k.context,k}));hp.canUseDOM?gp(h):aa&&(c=aa(h)),a(c)}init(){if(this.rendered)return;this.rendered=!0;const{helmetInstances:s}=this.props.context;s.add(this),this.emitChange()}render(){return this.init(),null}},ia,eh=(ia=class extends B.Component{shouldComponentUpdate(l){return!Gf(bc(this.props,"helmetData"),bc(l,"helmetData"))}mapNestedChildrenToProps(l,s){if(!s)return null;switch(l.type){case"script":case"noscript":return{innerHTML:s};case"style":return{cssText:s};default:throw new Error(`<${l.type} /> elements are self-closing and can not contain children. Refer to our API for more information.`)}}flattenArrayTypeChildren(l,s,a,c){return{...s,[l.type]:[...s[l.type]||[],{...a,...this.mapNestedChildrenToProps(l,c)}]}}mapObjectTypeChildren(l,s,a,c){switch(l.type){case"title":return{...s,[l.type]:c,titleAttributes:{...a}};case"body":return{...s,bodyAttributes:{...a}};case"html":return{...s,htmlAttributes:{...a}};default:return{...s,[l.type]:{...a}}}}mapArrayTypeChildrenToProps(l,s){let a={...s};return Object.keys(l).forEach(c=>{a={...a,[c]:l[c]}}),a}warnOnInvalidChildren(l,s){return uc(yc.some(a=>l.type===a),typeof l.type=="function"?"You may be attempting to nest <Helmet> components within each other, which is not allowed. Refer to our API for more information.":`Only elements types ${yc.join(", ")} are allowed. Helmet does not support rendering <${l.type}> elements. Refer to our API for more information.`),uc(!s||typeof s=="string"||Array.isArray(s)&&!s.some(a=>typeof a!="string"),`Helmet expects a string as a child of <${l.type}>. Did you forget to wrap your children in braces? ( <${l.type}>{\`\`}</${l.type}> ) Refer to our API for more information.`),!0}mapChildrenToProps(l,s){let a={};return Oe.Children.forEach(l,c=>{if(!c||!c.props)return;const{children:h,...v}=c.props,k=Object.keys(v).reduce((x,_)=>(x[Jf[_]||_]=v[_],x),{});let{type:w}=c;switch(typeof w=="symbol"?w=w.toString():this.warnOnInvalidChildren(c,h),w){case"Symbol(react.fragment)":s=this.mapChildrenToProps(h,s);break;case"link":case"meta":case"noscript":case"script":case"style":a=this.flattenArrayTypeChildren(c,a,k,h);break;default:s=this.mapObjectTypeChildren(c,s,k,h);break}}),this.mapArrayTypeChildrenToProps(a,s)}render(){const{children:l,...s}=this.props;let a={...s},{helmetData:c}=s;if(l&&(a=this.mapChildrenToProps(l,a)),c&&!(c instanceof ua)){const h=c;c=new ua(h.context,!0),delete a.helmetData}return c?Oe.createElement(xc,{...a,context:c.value}):Oe.createElement(jc.Consumer,null,h=>Oe.createElement(xc,{...a,context:h}))}},Dn(ia,"defaultProps",{defer:!0,encodeSpecialCharacters:!0,prioritizeSeoTags:!1}),ia);function yp(l){return Object.prototype.toString.call(l)==="[object Object]"}function wc(l){return yp(l)||Array.isArray(l)}function bp(){return!!(typeof window<"u"&&window.document&&window.document.createElement)}function pa(l,s){const a=Object.keys(l),c=Object.keys(s);if(a.length!==c.length)return!1;const h=JSON.stringify(Object.keys(l.breakpoints||{})),v=JSON.stringify(Object.keys(s.breakpoints||{}));return h!==v?!1:a.every(k=>{const w=l[k],x=s[k];return typeof w=="function"?`${w}`==`${x}`:!wc(w)||!wc(x)?w===x:pa(w,x)})}function Sc(l){return l.concat().sort((s,a)=>s.name>a.name?1:-1).map(s=>s.options)}function kp(l,s){if(l.length!==s.length)return!1;const a=Sc(l),c=Sc(s);return a.every((h,v)=>{const k=c[v];return pa(h,k)})}function Fc(l={},s=[]){const a=B.useRef(l),c=B.useRef(s),[h,v]=B.useState(),[k,w]=B.useState(),x=B.useCallback(()=>{h&&h.reInit(a.current,c.current)},[h]);return B.useEffect(()=>{pa(a.current,l)||(a.current=l,x())},[l,x]),B.useEffect(()=>{kp(c.current,s)||(c.current=s,x())},[s,x]),B.useEffect(()=>{if(bp()&&k){sc.globalOptions=Fc.globalOptions;const _=sc(k,a.current,c.current);return v(_),()=>_.destroy()}else v(void 0)},[k,v]),[w,h]}Fc.globalOptions=void 0;function ye(l,s){s===void 0&&(s={});var a=s.insertAt;if(l&&typeof document<"u"){var c=document.head||document.getElementsByTagName("head")[0],h=document.createElement("style");h.type="text/css",a==="top"&&c.firstChild?c.insertBefore(h,c.firstChild):c.appendChild(h),h.styleSheet?h.styleSheet.cssText=l:h.appendChild(document.createTextNode(l))}}ye(`.react-loading-indicator-normalize,
[class$=rli-bounding-box] {
  font-size: 1rem;
  display: inline-block;
  box-sizing: border-box;
  text-align: unset;
  isolation: isolate;
}

.rli-d-i-b {
  display: inline-block;
}

.rli-text-format {
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  font-weight: 600;
  width: 90%;
  text-transform: uppercase;
  text-align: center;
  font-size: 0.7em;
  letter-spacing: 0.5px;
  font-family: system-ui, -apple-system, BlinkMacSystemFont, "Avenir Next", "Avenir", "Segoe UI", "Lucida Grande", "Helvetica Neue", "Helvetica", "Fira Sans", "Roboto", "Noto", "Droid Sans", "Cantarell", "Oxygen", "Ubuntu", "Franklin Gothic Medium", "Century Gothic", "Liberation Sans", sans-serif;
}`);var wn=function(){return wn=Object.assign||function(l){for(var s,a=1,c=arguments.length;a<c;a++)for(var h in s=arguments[a])Object.prototype.hasOwnProperty.call(s,h)&&(l[h]=s[h]);return l},wn.apply(this,arguments)};function ni(l){return ni=typeof Symbol=="function"&&typeof Symbol.iterator=="symbol"?function(s){return typeof s}:function(s){return s&&typeof Symbol=="function"&&s.constructor===Symbol&&s!==Symbol.prototype?"symbol":typeof s},ni(l)}var xp=/^\s+/,wp=/\s+$/;function L(l,s){if(s=s||{},(l=l||"")instanceof L)return l;if(!(this instanceof L))return new L(l,s);var a=(function(c){var h={r:0,g:0,b:0},v=1,k=null,w=null,x=null,_=!1,A=!1;typeof c=="string"&&(c=(function(U){U=U.replace(xp,"").replace(wp,"").toLowerCase();var C,j=!1;if(ca[U])U=ca[U],j=!0;else if(U=="transparent")return{r:0,g:0,b:0,a:0,format:"name"};return(C=pn.rgb.exec(U))?{r:C[1],g:C[2],b:C[3]}:(C=pn.rgba.exec(U))?{r:C[1],g:C[2],b:C[3],a:C[4]}:(C=pn.hsl.exec(U))?{h:C[1],s:C[2],l:C[3]}:(C=pn.hsla.exec(U))?{h:C[1],s:C[2],l:C[3],a:C[4]}:(C=pn.hsv.exec(U))?{h:C[1],s:C[2],v:C[3]}:(C=pn.hsva.exec(U))?{h:C[1],s:C[2],v:C[3],a:C[4]}:(C=pn.hex8.exec(U))?{r:Ye(C[1]),g:Ye(C[2]),b:Ye(C[3]),a:Tc(C[4]),format:j?"name":"hex8"}:(C=pn.hex6.exec(U))?{r:Ye(C[1]),g:Ye(C[2]),b:Ye(C[3]),format:j?"name":"hex"}:(C=pn.hex4.exec(U))?{r:Ye(C[1]+""+C[1]),g:Ye(C[2]+""+C[2]),b:Ye(C[3]+""+C[3]),a:Tc(C[4]+""+C[4]),format:j?"name":"hex8"}:(C=pn.hex3.exec(U))?{r:Ye(C[1]+""+C[1]),g:Ye(C[2]+""+C[2]),b:Ye(C[3]+""+C[3]),format:j?"name":"hex"}:!1})(c)),ni(c)=="object"&&(Mn(c.r)&&Mn(c.g)&&Mn(c.b)?(X=c.r,W=c.g,J=c.b,h={r:255*ae(X,255),g:255*ae(W,255),b:255*ae(J,255)},_=!0,A=String(c.r).substr(-1)==="%"?"prgb":"rgb"):Mn(c.h)&&Mn(c.s)&&Mn(c.v)?(k=Lr(c.s),w=Lr(c.v),h=(function(U,C,j){U=6*ae(U,360),C=ae(C,100),j=ae(j,100);var ze=Math.floor(U),De=U-ze,be=j*(1-C),he=j*(1-De*C),Me=j*(1-(1-De)*C),ke=ze%6,Ee=[j,he,be,be,Me,j][ke],Ze=[Me,j,j,he,be,be][ke],_e=[be,be,Me,j,j,he][ke];return{r:255*Ee,g:255*Ze,b:255*_e}})(c.h,k,w),_=!0,A="hsv"):Mn(c.h)&&Mn(c.s)&&Mn(c.l)&&(k=Lr(c.s),x=Lr(c.l),h=(function(U,C,j){var ze,De,be;function he(Ee,Ze,_e){return _e<0&&(_e+=1),_e>1&&(_e-=1),_e<1/6?Ee+6*(Ze-Ee)*_e:_e<.5?Ze:_e<2/3?Ee+(Ze-Ee)*(2/3-_e)*6:Ee}if(U=ae(U,360),C=ae(C,100),j=ae(j,100),C===0)ze=De=be=j;else{var Me=j<.5?j*(1+C):j+C-j*C,ke=2*j-Me;ze=he(ke,Me,U+1/3),De=he(ke,Me,U),be=he(ke,Me,U-1/3)}return{r:255*ze,g:255*De,b:255*be}})(c.h,k,x),_=!0,A="hsl"),c.hasOwnProperty("a")&&(v=c.a));var X,W,J;return v=Ic(v),{ok:_,format:c.format||A,r:Math.min(255,Math.max(h.r,0)),g:Math.min(255,Math.max(h.g,0)),b:Math.min(255,Math.max(h.b,0)),a:v}})(l);this._originalInput=l,this._r=a.r,this._g=a.g,this._b=a.b,this._a=a.a,this._roundA=Math.round(100*this._a)/100,this._format=s.format||a.format,this._gradientType=s.gradientType,this._r<1&&(this._r=Math.round(this._r)),this._g<1&&(this._g=Math.round(this._g)),this._b<1&&(this._b=Math.round(this._b)),this._ok=a.ok}function Pc(l,s,a){l=ae(l,255),s=ae(s,255),a=ae(a,255);var c,h,v=Math.max(l,s,a),k=Math.min(l,s,a),w=(v+k)/2;if(v==k)c=h=0;else{var x=v-k;switch(h=w>.5?x/(2-v-k):x/(v+k),v){case l:c=(s-a)/x+(s<a?6:0);break;case s:c=(a-l)/x+2;break;case a:c=(l-s)/x+4}c/=6}return{h:c,s:h,l:w}}function Oc(l,s,a){l=ae(l,255),s=ae(s,255),a=ae(a,255);var c,h,v=Math.max(l,s,a),k=Math.min(l,s,a),w=v,x=v-k;if(h=v===0?0:x/v,v==k)c=0;else{switch(v){case l:c=(s-a)/x+(s<a?6:0);break;case s:c=(a-l)/x+2;break;case a:c=(l-s)/x+4}c/=6}return{h:c,s:h,v:w}}function Ec(l,s,a,c){var h=[mn(Math.round(l).toString(16)),mn(Math.round(s).toString(16)),mn(Math.round(a).toString(16))];return c&&h[0].charAt(0)==h[0].charAt(1)&&h[1].charAt(0)==h[1].charAt(1)&&h[2].charAt(0)==h[2].charAt(1)?h[0].charAt(0)+h[1].charAt(0)+h[2].charAt(0):h.join("")}function _c(l,s,a,c){return[mn(Hc(c)),mn(Math.round(l).toString(16)),mn(Math.round(s).toString(16)),mn(Math.round(a).toString(16))].join("")}function Sp(l,s){s=s===0?0:s||10;var a=L(l).toHsl();return a.s-=s/100,a.s=ri(a.s),L(a)}function Pp(l,s){s=s===0?0:s||10;var a=L(l).toHsl();return a.s+=s/100,a.s=ri(a.s),L(a)}function Op(l){return L(l).desaturate(100)}function Ep(l,s){s=s===0?0:s||10;var a=L(l).toHsl();return a.l+=s/100,a.l=ri(a.l),L(a)}function _p(l,s){s=s===0?0:s||10;var a=L(l).toRgb();return a.r=Math.max(0,Math.min(255,a.r-Math.round(-s/100*255))),a.g=Math.max(0,Math.min(255,a.g-Math.round(-s/100*255))),a.b=Math.max(0,Math.min(255,a.b-Math.round(-s/100*255))),L(a)}function Cp(l,s){s=s===0?0:s||10;var a=L(l).toHsl();return a.l-=s/100,a.l=ri(a.l),L(a)}function Tp(l,s){var a=L(l).toHsl(),c=(a.h+s)%360;return a.h=c<0?360+c:c,L(a)}function zp(l){var s=L(l).toHsl();return s.h=(s.h+180)%360,L(s)}function Cc(l,s){if(isNaN(s)||s<=0)throw new Error("Argument to polyad must be a positive number");for(var a=L(l).toHsl(),c=[L(l)],h=360/s,v=1;v<s;v++)c.push(L({h:(a.h+v*h)%360,s:a.s,l:a.l}));return c}function Dp(l){var s=L(l).toHsl(),a=s.h;return[L(l),L({h:(a+72)%360,s:s.s,l:s.l}),L({h:(a+216)%360,s:s.s,l:s.l})]}function Mp(l,s,a){s=s||6,a=a||30;var c=L(l).toHsl(),h=360/a,v=[L(l)];for(c.h=(c.h-(h*s>>1)+720)%360;--s;)c.h=(c.h+h)%360,v.push(L(c));return v}function Rp(l,s){s=s||6;for(var a=L(l).toHsv(),c=a.h,h=a.s,v=a.v,k=[],w=1/s;s--;)k.push(L({h:c,s:h,v})),v=(v+w)%1;return k}L.prototype={isDark:function(){return this.getBrightness()<128},isLight:function(){return!this.isDark()},isValid:function(){return this._ok},getOriginalInput:function(){return this._originalInput},getFormat:function(){return this._format},getAlpha:function(){return this._a},getBrightness:function(){var l=this.toRgb();return(299*l.r+587*l.g+114*l.b)/1e3},getLuminance:function(){var l,s,a,c=this.toRgb();return l=c.r/255,s=c.g/255,a=c.b/255,.2126*(l<=.03928?l/12.92:Math.pow((l+.055)/1.055,2.4))+.7152*(s<=.03928?s/12.92:Math.pow((s+.055)/1.055,2.4))+.0722*(a<=.03928?a/12.92:Math.pow((a+.055)/1.055,2.4))},setAlpha:function(l){return this._a=Ic(l),this._roundA=Math.round(100*this._a)/100,this},toHsv:function(){var l=Oc(this._r,this._g,this._b);return{h:360*l.h,s:l.s,v:l.v,a:this._a}},toHsvString:function(){var l=Oc(this._r,this._g,this._b),s=Math.round(360*l.h),a=Math.round(100*l.s),c=Math.round(100*l.v);return this._a==1?"hsv("+s+", "+a+"%, "+c+"%)":"hsva("+s+", "+a+"%, "+c+"%, "+this._roundA+")"},toHsl:function(){var l=Pc(this._r,this._g,this._b);return{h:360*l.h,s:l.s,l:l.l,a:this._a}},toHslString:function(){var l=Pc(this._r,this._g,this._b),s=Math.round(360*l.h),a=Math.round(100*l.s),c=Math.round(100*l.l);return this._a==1?"hsl("+s+", "+a+"%, "+c+"%)":"hsla("+s+", "+a+"%, "+c+"%, "+this._roundA+")"},toHex:function(l){return Ec(this._r,this._g,this._b,l)},toHexString:function(l){return"#"+this.toHex(l)},toHex8:function(l){return(function(s,a,c,h,v){var k=[mn(Math.round(s).toString(16)),mn(Math.round(a).toString(16)),mn(Math.round(c).toString(16)),mn(Hc(h))];return v&&k[0].charAt(0)==k[0].charAt(1)&&k[1].charAt(0)==k[1].charAt(1)&&k[2].charAt(0)==k[2].charAt(1)&&k[3].charAt(0)==k[3].charAt(1)?k[0].charAt(0)+k[1].charAt(0)+k[2].charAt(0)+k[3].charAt(0):k.join("")})(this._r,this._g,this._b,this._a,l)},toHex8String:function(l){return"#"+this.toHex8(l)},toRgb:function(){return{r:Math.round(this._r),g:Math.round(this._g),b:Math.round(this._b),a:this._a}},toRgbString:function(){return this._a==1?"rgb("+Math.round(this._r)+", "+Math.round(this._g)+", "+Math.round(this._b)+")":"rgba("+Math.round(this._r)+", "+Math.round(this._g)+", "+Math.round(this._b)+", "+this._roundA+")"},toPercentageRgb:function(){return{r:Math.round(100*ae(this._r,255))+"%",g:Math.round(100*ae(this._g,255))+"%",b:Math.round(100*ae(this._b,255))+"%",a:this._a}},toPercentageRgbString:function(){return this._a==1?"rgb("+Math.round(100*ae(this._r,255))+"%, "+Math.round(100*ae(this._g,255))+"%, "+Math.round(100*ae(this._b,255))+"%)":"rgba("+Math.round(100*ae(this._r,255))+"%, "+Math.round(100*ae(this._g,255))+"%, "+Math.round(100*ae(this._b,255))+"%, "+this._roundA+")"},toName:function(){return this._a===0?"transparent":!(this._a<1)&&(Np[Ec(this._r,this._g,this._b,!0)]||!1)},toFilter:function(l){var s="#"+_c(this._r,this._g,this._b,this._a),a=s,c=this._gradientType?"GradientType = 1, ":"";if(l){var h=L(l);a="#"+_c(h._r,h._g,h._b,h._a)}return"progid:DXImageTransform.Microsoft.gradient("+c+"startColorstr="+s+",endColorstr="+a+")"},toString:function(l){var s=!!l;l=l||this._format;var a=!1,c=this._a<1&&this._a>=0;return s||!c||l!=="hex"&&l!=="hex6"&&l!=="hex3"&&l!=="hex4"&&l!=="hex8"&&l!=="name"?(l==="rgb"&&(a=this.toRgbString()),l==="prgb"&&(a=this.toPercentageRgbString()),l!=="hex"&&l!=="hex6"||(a=this.toHexString()),l==="hex3"&&(a=this.toHexString(!0)),l==="hex4"&&(a=this.toHex8String(!0)),l==="hex8"&&(a=this.toHex8String()),l==="name"&&(a=this.toName()),l==="hsl"&&(a=this.toHslString()),l==="hsv"&&(a=this.toHsvString()),a||this.toHexString()):l==="name"&&this._a===0?this.toName():this.toRgbString()},clone:function(){return L(this.toString())},_applyModification:function(l,s){var a=l.apply(null,[this].concat([].slice.call(s)));return this._r=a._r,this._g=a._g,this._b=a._b,this.setAlpha(a._a),this},lighten:function(){return this._applyModification(Ep,arguments)},brighten:function(){return this._applyModification(_p,arguments)},darken:function(){return this._applyModification(Cp,arguments)},desaturate:function(){return this._applyModification(Sp,arguments)},saturate:function(){return this._applyModification(Pp,arguments)},greyscale:function(){return this._applyModification(Op,arguments)},spin:function(){return this._applyModification(Tp,arguments)},_applyCombination:function(l,s){return l.apply(null,[this].concat([].slice.call(s)))},analogous:function(){return this._applyCombination(Mp,arguments)},complement:function(){return this._applyCombination(zp,arguments)},monochromatic:function(){return this._applyCombination(Rp,arguments)},splitcomplement:function(){return this._applyCombination(Dp,arguments)},triad:function(){return this._applyCombination(Cc,[3])},tetrad:function(){return this._applyCombination(Cc,[4])}},L.fromRatio=function(l,s){if(ni(l)=="object"){var a={};for(var c in l)l.hasOwnProperty(c)&&(a[c]=c==="a"?l[c]:Lr(l[c]));l=a}return L(l,s)},L.equals=function(l,s){return!(!l||!s)&&L(l).toRgbString()==L(s).toRgbString()},L.random=function(){return L.fromRatio({r:Math.random(),g:Math.random(),b:Math.random()})},L.mix=function(l,s,a){a=a===0?0:a||50;var c=L(l).toRgb(),h=L(s).toRgb(),v=a/100;return L({r:(h.r-c.r)*v+c.r,g:(h.g-c.g)*v+c.g,b:(h.b-c.b)*v+c.b,a:(h.a-c.a)*v+c.a})},L.readability=function(l,s){var a=L(l),c=L(s);return(Math.max(a.getLuminance(),c.getLuminance())+.05)/(Math.min(a.getLuminance(),c.getLuminance())+.05)},L.isReadable=function(l,s,a){var c,h,v=L.readability(l,s);switch(h=!1,(c=(function(k){var w,x;return w=((k=k||{level:"AA",size:"small"}).level||"AA").toUpperCase(),x=(k.size||"small").toLowerCase(),w!=="AA"&&w!=="AAA"&&(w="AA"),x!=="small"&&x!=="large"&&(x="small"),{level:w,size:x}})(a)).level+c.size){case"AAsmall":case"AAAlarge":h=v>=4.5;break;case"AAlarge":h=v>=3;break;case"AAAsmall":h=v>=7}return h},L.mostReadable=function(l,s,a){var c,h,v,k,w=null,x=0;h=(a=a||{}).includeFallbackColors,v=a.level,k=a.size;for(var _=0;_<s.length;_++)(c=L.readability(l,s[_]))>x&&(x=c,w=L(s[_]));return L.isReadable(l,w,{level:v,size:k})||!h?w:(a.includeFallbackColors=!1,L.mostReadable(l,["#fff","#000"],a))};var ca=L.names={aliceblue:"f0f8ff",antiquewhite:"faebd7",aqua:"0ff",aquamarine:"7fffd4",azure:"f0ffff",beige:"f5f5dc",bisque:"ffe4c4",black:"000",blanchedalmond:"ffebcd",blue:"00f",blueviolet:"8a2be2",brown:"a52a2a",burlywood:"deb887",burntsienna:"ea7e5d",cadetblue:"5f9ea0",chartreuse:"7fff00",chocolate:"d2691e",coral:"ff7f50",cornflowerblue:"6495ed",cornsilk:"fff8dc",crimson:"dc143c",cyan:"0ff",darkblue:"00008b",darkcyan:"008b8b",darkgoldenrod:"b8860b",darkgray:"a9a9a9",darkgreen:"006400",darkgrey:"a9a9a9",darkkhaki:"bdb76b",darkmagenta:"8b008b",darkolivegreen:"556b2f",darkorange:"ff8c00",darkorchid:"9932cc",darkred:"8b0000",darksalmon:"e9967a",darkseagreen:"8fbc8f",darkslateblue:"483d8b",darkslategray:"2f4f4f",darkslategrey:"2f4f4f",darkturquoise:"00ced1",darkviolet:"9400d3",deeppink:"ff1493",deepskyblue:"00bfff",dimgray:"696969",dimgrey:"696969",dodgerblue:"1e90ff",firebrick:"b22222",floralwhite:"fffaf0",forestgreen:"228b22",fuchsia:"f0f",gainsboro:"dcdcdc",ghostwhite:"f8f8ff",gold:"ffd700",goldenrod:"daa520",gray:"808080",green:"008000",greenyellow:"adff2f",grey:"808080",honeydew:"f0fff0",hotpink:"ff69b4",indianred:"cd5c5c",indigo:"4b0082",ivory:"fffff0",khaki:"f0e68c",lavender:"e6e6fa",lavenderblush:"fff0f5",lawngreen:"7cfc00",lemonchiffon:"fffacd",lightblue:"add8e6",lightcoral:"f08080",lightcyan:"e0ffff",lightgoldenrodyellow:"fafad2",lightgray:"d3d3d3",lightgreen:"90ee90",lightgrey:"d3d3d3",lightpink:"ffb6c1",lightsalmon:"ffa07a",lightseagreen:"20b2aa",lightskyblue:"87cefa",lightslategray:"789",lightslategrey:"789",lightsteelblue:"b0c4de",lightyellow:"ffffe0",lime:"0f0",limegreen:"32cd32",linen:"faf0e6",magenta:"f0f",maroon:"800000",mediumaquamarine:"66cdaa",mediumblue:"0000cd",mediumorchid:"ba55d3",mediumpurple:"9370db",mediumseagreen:"3cb371",mediumslateblue:"7b68ee",mediumspringgreen:"00fa9a",mediumturquoise:"48d1cc",mediumvioletred:"c71585",midnightblue:"191970",mintcream:"f5fffa",mistyrose:"ffe4e1",moccasin:"ffe4b5",navajowhite:"ffdead",navy:"000080",oldlace:"fdf5e6",olive:"808000",olivedrab:"6b8e23",orange:"ffa500",orangered:"ff4500",orchid:"da70d6",palegoldenrod:"eee8aa",palegreen:"98fb98",paleturquoise:"afeeee",palevioletred:"db7093",papayawhip:"ffefd5",peachpuff:"ffdab9",peru:"cd853f",pink:"ffc0cb",plum:"dda0dd",powderblue:"b0e0e6",purple:"800080",rebeccapurple:"663399",red:"f00",rosybrown:"bc8f8f",royalblue:"4169e1",saddlebrown:"8b4513",salmon:"fa8072",sandybrown:"f4a460",seagreen:"2e8b57",seashell:"fff5ee",sienna:"a0522d",silver:"c0c0c0",skyblue:"87ceeb",slateblue:"6a5acd",slategray:"708090",slategrey:"708090",snow:"fffafa",springgreen:"00ff7f",steelblue:"4682b4",tan:"d2b48c",teal:"008080",thistle:"d8bfd8",tomato:"ff6347",turquoise:"40e0d0",violet:"ee82ee",wheat:"f5deb3",white:"fff",whitesmoke:"f5f5f5",yellow:"ff0",yellowgreen:"9acd32"},Np=L.hexNames=(function(l){var s={};for(var a in l)l.hasOwnProperty(a)&&(s[l[a]]=a);return s})(ca);function Ic(l){return l=parseFloat(l),(isNaN(l)||l<0||l>1)&&(l=1),l}function ae(l,s){(function(c){return typeof c=="string"&&c.indexOf(".")!=-1&&parseFloat(c)===1})(l)&&(l="100%");var a=(function(c){return typeof c=="string"&&c.indexOf("%")!=-1})(l);return l=Math.min(s,Math.max(0,parseFloat(l))),a&&(l=parseInt(l*s,10)/100),Math.abs(l-s)<1e-6?1:l%s/parseFloat(s)}function ri(l){return Math.min(1,Math.max(0,l))}function Ye(l){return parseInt(l,16)}function mn(l){return l.length==1?"0"+l:""+l}function Lr(l){return l<=1&&(l=100*l+"%"),l}function Hc(l){return Math.round(255*parseFloat(l)).toString(16)}function Tc(l){return Ye(l)/255}var et,Zo,Go,pn=(Zo="[\\s|\\(]+("+(et="(?:[-\\+]?\\d*\\.\\d+%?)|(?:[-\\+]?\\d+%?)")+")[,|\\s]+("+et+")[,|\\s]+("+et+")\\s*\\)?",Go="[\\s|\\(]+("+et+")[,|\\s]+("+et+")[,|\\s]+("+et+")[,|\\s]+("+et+")\\s*\\)?",{CSS_UNIT:new RegExp(et),rgb:new RegExp("rgb"+Zo),rgba:new RegExp("rgba"+Go),hsl:new RegExp("hsl"+Zo),hsla:new RegExp("hsla"+Go),hsv:new RegExp("hsv"+Zo),hsva:new RegExp("hsva"+Go),hex3:/^#?([0-9a-fA-F]{1})([0-9a-fA-F]{1})([0-9a-fA-F]{1})$/,hex6:/^#?([0-9a-fA-F]{2})([0-9a-fA-F]{2})([0-9a-fA-F]{2})$/,hex4:/^#?([0-9a-fA-F]{1})([0-9a-fA-F]{1})([0-9a-fA-F]{1})([0-9a-fA-F]{1})$/,hex8:/^#?([0-9a-fA-F]{2})([0-9a-fA-F]{2})([0-9a-fA-F]{2})([0-9a-fA-F]{2})$/});function Mn(l){return!!pn.CSS_UNIT.exec(l)}var Ap=function(l,s){var a=(typeof l=="string"?parseInt(l):l)||0;if(a>=-5&&a<=5){var c=a,h=parseFloat(s),v=h+c*(h/5)*-1;return(v==0||v<=Number.EPSILON)&&(v=.1),{animationPeriod:v+"s"}}return{animationPeriod:s}},Lp=function(l,s){var a=l||{},c="";switch(s){case"small":c="12px";break;case"medium":c="16px";break;case"large":c="20px";break;default:c=void 0}var h={};if(a.fontSize){var v=a.fontSize;h=(function(k,w){var x={};for(var _ in k)Object.prototype.hasOwnProperty.call(k,_)&&w.indexOf(_)<0&&(x[_]=k[_]);if(k!=null&&typeof Object.getOwnPropertySymbols=="function"){var A=0;for(_=Object.getOwnPropertySymbols(k);A<_.length;A++)w.indexOf(_[A])<0&&Object.prototype.propertyIsEnumerable.call(k,_[A])&&(x[_[A]]=k[_[A]])}return x})(a,["fontSize"]),c=v}return{fontSize:c,styles:h}},jp={color:"currentColor",mixBlendMode:"difference",width:"unset",display:"block",paddingTop:"2px"},Fp=function(l){var s=l.className,a=l.text,c=l.textColor,h=l.staticText,v=l.style;return a?Oe.createElement("span",{className:"rli-d-i-b rli-text-format ".concat(s||"").trim(),style:wn(wn(wn({},h&&jp),c&&{color:c,mixBlendMode:"unset"}),v&&v)},typeof a=="string"&&a.length?a:"loading"):null},Uc="rgb(50, 205, 50)";function Ip(l,s){if(s===void 0&&(s=0),l.length===0)throw new Error("Input array cannot be empty!");var a=[];return(function c(h,v){return v===void 0&&(v=0),a.push.apply(a,h),a.length<v&&c(a,v),a.slice(0,v)})(l,s)}ye(`.atom-rli-bounding-box {
  --atom-phase1-rgb: 50, 205, 50;
  color: rgba(var(--atom-phase1-rgb), 1);
  font-size: 16px;
  position: relative;
  text-align: unset;
  isolation: isolate;
}
.atom-rli-bounding-box .atom-indicator {
  width: 6em;
  height: 6em;
  position: relative;
  perspective: 6em;
  overflow: hidden;
  color: rgba(var(--atom-phase1-rgb), 1);
  animation: calc(var(--rli-animation-duration, 1s) * 4) var(--rli-animation-function, linear) infinite uxlv7gg;
}
.atom-rli-bounding-box .atom-indicator::after, .atom-rli-bounding-box .atom-indicator::before {
  content: "";
  position: absolute;
  top: 0;
  right: 0;
  bottom: 0;
  left: 0;
  width: 0.48em;
  height: 0.48em;
  margin: auto;
  border-radius: 50%;
  background-image: radial-gradient(circle at 35% 15%, rgba(var(--atom-phase1-rgb), 0.1), rgba(var(--atom-phase1-rgb), 0.3) 37%, rgba(var(--atom-phase1-rgb), 1) 100%);
  animation: calc(var(--rli-animation-duration, 1s) * 4) var(--rli-animation-function, linear) infinite uxlv7eg;
}
.atom-rli-bounding-box .atom-indicator::before {
  filter: drop-shadow(0px 0px 0.0625em currentColor);
}
.atom-rli-bounding-box .atom-indicator .electron-orbit {
  color: rgba(var(--atom-phase1-rgb), 0.85);
  border: 0;
  border-left: 0.4em solid currentColor;
  box-sizing: border-box;
  position: absolute;
  top: 0;
  right: 0;
  bottom: 0;
  left: 0;
  margin: auto;
  width: 4.8em;
  height: 4.8em;
  background-color: transparent;
  border-radius: 50%;
  transform-style: preserve-3d;
  animation: var(--rli-animation-duration, 1s) var(--rli-animation-function, linear) infinite uxlv7fj, calc(var(--rli-animation-duration, 1s) * 4) var(--rli-animation-function, linear) infinite uxlv7gy;
}
.atom-rli-bounding-box .atom-indicator .electron-orbit::after {
  content: "";
  position: absolute;
  top: 0;
  right: 0;
  bottom: 0;
  left: 0;
  border-radius: 50%;
  color: rgba(var(--atom-phase1-rgb), 0.18);
  animation: calc(var(--rli-animation-duration, 1s) * 4) var(--rli-animation-function, linear) infinite uxlv7hv;
  border: 0.125em solid currentColor;
}
.atom-rli-bounding-box .atom-indicator .electron-orbit::before {
  content: "";
  width: 0.192em;
  height: 0.192em;
  position: absolute;
  border-radius: 50%;
  top: -0.096em;
  right: 0;
  bottom: 0;
  left: 0;
  margin: 0 auto;
  color: rgba(var(--atom-phase1-rgb), 1);
  box-shadow: 0px 0px 0.0625em 0.0625em currentColor, 0px 0px 0.0625em 0.125em currentColor;
  background-color: currentColor;
  transform: rotateY(-70deg);
  animation: var(--rli-animation-duration, 1s) var(--rli-animation-function, linear) infinite uxlv7ew, calc(var(--rli-animation-duration, 1s) * 4) var(--rli-animation-function, linear) infinite uxlv7gg;
}
.atom-rli-bounding-box .atom-indicator .electron-orbit:nth-of-type(1) {
  --orbit-vector-factor: -1;
  transform: rotateY(65deg) rotateX(calc(54deg * var(--orbit-vector-factor)));
}
.atom-rli-bounding-box .atom-indicator .electron-orbit:nth-of-type(2) {
  --orbit-vector-factor: 1;
  transform: rotateY(65deg) rotateX(calc(54deg * var(--orbit-vector-factor)));
}
.atom-rli-bounding-box .atom-indicator .electron-orbit:nth-of-type(3) {
  --orbit-vector-factor: 0;
  transform: rotateY(65deg) rotateX(calc(54deg * var(--orbit-vector-factor)));
  animation-delay: calc(var(--rli-animation-duration, 1s) * 0.5 * -1), calc(var(--rli-animation-duration, 1s) * 4 * -1);
}
.atom-rli-bounding-box .atom-indicator .electron-orbit:nth-of-type(3)::before {
  animation-delay: calc(var(--rli-animation-duration, 1s) * 0.5 * -1), calc(var(--rli-animation-duration, 1s) * 4 * -1);
}
.atom-rli-bounding-box .atom-text {
  color: currentColor;
  mix-blend-mode: difference;
  width: unset;
  display: block;
}

@property --atom-phase1-rgb {
  syntax: "<number>#";
  inherits: true;
  initial-value: 50, 205, 50;
}
@property --atom-phase2-rgb {
  syntax: "<number>#";
  inherits: true;
  initial-value: 50, 205, 50;
}
@property --atom-phase3-rgb {
  syntax: "<number>#";
  inherits: true;
  initial-value: 50, 205, 50;
}
@property --atom-phase4-rgb {
  syntax: "<number>#";
  inherits: true;
  initial-value: 50, 205, 50;
}
@property --rli-animation-duration {
  syntax: "<time>";
  inherits: true;
  initial-value: 1s;
}
@keyframes uxlv7fj {
  from {
    transform: rotateY(70deg) rotateX(calc(54deg * var(--orbit-vector-factor))) rotateZ(0deg);
  }
  to {
    transform: rotateY(70deg) rotateX(calc(54deg * var(--orbit-vector-factor))) rotateZ(360deg);
  }
}
@keyframes uxlv7ew {
  from {
    transform: rotateY(-70deg) rotateX(0deg);
  }
  to {
    transform: rotateY(-70deg) rotateX(-360deg);
  }
}
@keyframes uxlv7eg {
  100%, 0% {
    background-image: radial-gradient(circle at 35% 15%, rgba(var(--atom-phase1-rgb), 0.1), rgba(var(--atom-phase1-rgb), 0.3) 37%, rgba(var(--atom-phase1-rgb), 1) 100%);
  }
  20% {
    background-image: radial-gradient(circle at 35% 15%, rgba(var(--atom-phase1-rgb), 0.1), rgba(var(--atom-phase1-rgb), 0.3) 37%, rgba(var(--atom-phase1-rgb), 1) 100%);
  }
  25% {
    background-image: radial-gradient(circle at 35% 15%, rgba(var(--atom-phase2-rgb, var(--atom-phase1-rgb)), 0.1), rgba(var(--atom-phase2-rgb, var(--atom-phase1-rgb)), 0.3) 37%, rgba(var(--atom-phase2-rgb, var(--atom-phase1-rgb)), 1) 100%);
  }
  45% {
    background-image: radial-gradient(circle at 35% 15%, rgba(var(--atom-phase2-rgb, var(--atom-phase1-rgb)), 0.1), rgba(var(--atom-phase2-rgb, var(--atom-phase1-rgb)), 0.3) 37%, rgba(var(--atom-phase2-rgb, var(--atom-phase1-rgb)), 1) 100%);
  }
  50% {
    background-image: radial-gradient(circle at 35% 15%, rgba(var(--atom-phase3-rgb, var(--atom-phase1-rgb)), 0.1), rgba(var(--atom-phase3-rgb, var(--atom-phase1-rgb)), 0.3) 37%, rgba(var(--atom-phase3-rgb, var(--atom-phase1-rgb)), 1) 100%);
  }
  70% {
    background-image: radial-gradient(circle at 35% 15%, rgba(var(--atom-phase3-rgb, var(--atom-phase1-rgb)), 0.1), rgba(var(--atom-phase3-rgb, var(--atom-phase1-rgb)), 0.3) 37%, rgba(var(--atom-phase3-rgb, var(--atom-phase1-rgb)), 1) 100%);
  }
  75% {
    background-image: radial-gradient(circle at 35% 15%, rgba(var(--atom-phase4-rgb, var(--atom-phase1-rgb)), 0.1), rgba(var(--atom-phase4-rgb, var(--atom-phase1-rgb)), 0.3) 37%, rgba(var(--atom-phase4-rgb, var(--atom-phase1-rgb)), 1) 100%);
  }
  95% {
    background-image: radial-gradient(circle at 35% 15%, rgba(var(--atom-phase4-rgb, var(--atom-phase1-rgb)), 0.1), rgba(var(--atom-phase4-rgb, var(--atom-phase1-rgb)), 0.3) 37%, rgba(var(--atom-phase4-rgb, var(--atom-phase1-rgb)), 1) 100%);
  }
}
@keyframes uxlv7gg {
  100%, 0% {
    color: rgba(var(--atom-phase1-rgb), 1);
  }
  20% {
    color: rgba(var(--atom-phase1-rgb), 1);
  }
  25% {
    color: rgba(var(--atom-phase2-rgb, var(--atom-phase1-rgb)), 1);
  }
  45% {
    color: rgba(var(--atom-phase2-rgb, var(--atom-phase1-rgb)), 1);
  }
  50% {
    color: rgba(var(--atom-phase3-rgb, var(--atom-phase1-rgb)), 1);
  }
  70% {
    color: rgba(var(--atom-phase3-rgb, var(--atom-phase1-rgb)), 1);
  }
  75% {
    color: rgba(var(--atom-phase4-rgb, var(--atom-phase1-rgb)), 1);
  }
  95% {
    color: rgba(var(--atom-phase4-rgb, var(--atom-phase1-rgb)), 1);
  }
}
@keyframes uxlv7gy {
  100%, 0% {
    color: rgba(var(--atom-phase1-rgb), 0.85);
  }
  20% {
    color: rgba(var(--atom-phase1-rgb), 0.85);
  }
  25% {
    color: rgba(var(--atom-phase2-rgb, var(--atom-phase1-rgb)), 0.85);
  }
  45% {
    color: rgba(var(--atom-phase2-rgb, var(--atom-phase1-rgb)), 0.85);
  }
  50% {
    color: rgba(var(--atom-phase3-rgb, var(--atom-phase1-rgb)), 0.85);
  }
  70% {
    color: rgba(var(--atom-phase3-rgb, var(--atom-phase1-rgb)), 0.85);
  }
  75% {
    color: rgba(var(--atom-phase4-rgb, var(--atom-phase1-rgb)), 0.85);
  }
  95% {
    color: rgba(var(--atom-phase4-rgb, var(--atom-phase1-rgb)), 0.85);
  }
}
@keyframes uxlv7hv {
  100%, 0% {
    color: rgba(var(--atom-phase1-rgb), 0.18);
  }
  20% {
    color: rgba(var(--atom-phase1-rgb), 0.18);
  }
  25% {
    color: rgba(var(--atom-phase2-rgb, var(--atom-phase1-rgb)), 0.18);
  }
  45% {
    color: rgba(var(--atom-phase2-rgb, var(--atom-phase1-rgb)), 0.18);
  }
  50% {
    color: rgba(var(--atom-phase3-rgb, var(--atom-phase1-rgb)), 0.18);
  }
  70% {
    color: rgba(var(--atom-phase3-rgb, var(--atom-phase1-rgb)), 0.18);
  }
  75% {
    color: rgba(var(--atom-phase4-rgb, var(--atom-phase1-rgb)), 0.18);
  }
  95% {
    color: rgba(var(--atom-phase4-rgb, var(--atom-phase1-rgb)), 0.18);
  }
}`);L(Uc).toRgb();Array.from({length:4},(function(l,s){return"--atom-phase".concat(s+1,"-rgb")}));ye(`.commet-rli-bounding-box {
  --commet-phase1-color: rgb(50, 205, 50);
  font-size: 16px;
  width: 6.85em;
  height: 6.85em;
  overflow: hidden;
  display: inline-block;
  box-sizing: border-box;
  position: relative;
  isolation: isolate;
}
.commet-rli-bounding-box .commet-indicator {
  top: 0;
  right: 0;
  bottom: 0;
  left: 0;
  margin: auto;
  box-sizing: border-box;
  width: 6em;
  height: 6em;
  color: var(--commet-phase1-color);
  display: inline-block;
  isolation: isolate;
  position: absolute;
  z-index: 0;
  animation: calc(var(--rli-animation-duration, 1.2s) * 4) var(--rli-animation-function, cubic-bezier(0.08, 0.03, 0.91, 0.93)) infinite uxlv7cp;
}
.commet-rli-bounding-box .commet-indicator .commet-box {
  position: absolute;
  display: inline-block;
  top: 0;
  right: 0;
  bottom: 0;
  bottom: 0;
  left: 0;
  margin: auto;
  animation: uxlv7bx var(--rli-animation-duration, 1.2s) var(--rli-animation-function, cubic-bezier(0.08, 0.03, 0.91, 0.93)) infinite;
}
.commet-rli-bounding-box .commet-indicator .commet-box:nth-of-type(1) {
  width: 100%;
  height: 100%;
  animation-direction: normal;
}
.commet-rli-bounding-box .commet-indicator .commet-box:nth-of-type(2) {
  width: 70%;
  height: 70%;
  animation-direction: reverse;
}
.commet-rli-bounding-box .commet-indicator .commet-box .commetball-box {
  position: absolute;
  top: 0;
  right: 0;
  bottom: 0;
  bottom: 0;
  left: 0;
  display: inline-block;
}
.commet-rli-bounding-box .commet-indicator .commet-box .commetball-box::before {
  content: "";
  width: 0.5em;
  height: 0.5em;
  border-radius: 50%;
  background-color: currentColor;
  position: absolute;
  top: -0.125em;
  left: 50%;
  transform: translateX(-50%);
  box-shadow: 0 0 0.2em 0em currentColor, 0 0 0.6em 0em currentColor;
}
.commet-rli-bounding-box .commet-indicator .commet-box .commet-trail {
  position: absolute;
  top: 0;
  right: 0;
  bottom: 0;
  bottom: 0;
  left: 0;
  border-radius: 50%;
  box-sizing: border-box;
  border-style: solid;
}
.commet-rli-bounding-box .commet-indicator .commet-box .commet-trail.trail1 {
  border-color: currentColor transparent transparent currentColor;
  border-width: 0.25em 0.25em 0 0;
  transform: rotateZ(-45deg);
}
.commet-rli-bounding-box .commet-indicator .commet-box .commet-trail.trail2 {
  border-color: currentColor currentColor transparent transparent;
  border-width: 0.25em 0 0 0.25em;
  transform: rotateZ(45deg);
}
.commet-rli-bounding-box .commet-text {
  mix-blend-mode: difference;
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  color: var(--commet-phase1-color);
}

@property --commet-phase1-color {
  syntax: "<color>";
  inherits: true;
  initial-value: rgb(50, 205, 50);
}
@property --commet-phase2-color {
  syntax: "<color>";
  inherits: true;
  initial-value: rgb(50, 205, 50);
}
@property --commet-phase3-color {
  syntax: "<color>";
  inherits: true;
  initial-value: rgb(50, 205, 50);
}
@property --commet-phase4-color {
  syntax: "<color>";
  inherits: true;
  initial-value: rgb(50, 205, 50);
}
@property --rli-animation-duration {
  syntax: "<time>";
  inherits: true;
  initial-value: 1.2s;
}
@keyframes uxlv7bx {
  to {
    transform: rotate(1turn);
  }
}
@keyframes uxlv7cp {
  100%, 0% {
    color: var(--commet-phase1-color);
  }
  20% {
    color: var(--commet-phase1-color);
  }
  25% {
    color: var(--commet-phase2-color, var(--commet-phase1-color));
  }
  45% {
    color: var(--commet-phase2-color, var(--commet-phase1-color));
  }
  50% {
    color: var(--commet-phase3-color, var(--commet-phase1-color));
  }
  70% {
    color: var(--commet-phase3-color, var(--commet-phase1-color));
  }
  75% {
    color: var(--commet-phase4-color, var(--commet-phase1-color));
  }
  95% {
    color: var(--commet-phase4-color, var(--commet-phase1-color));
  }
}`);Array.from({length:4},(function(l,s){return"--commet-phase".concat(s+1,"-color")}));ye(`.OP-annulus-rli-bounding-box {
  --OP-annulus-phase1-color: rgb(50, 205, 50);
  font-size: 16px;
  display: inline-block;
}
.OP-annulus-rli-bounding-box .OP-annulus-indicator {
  width: 5em;
  height: 5em;
  color: var(--OP-annulus-phase1-color);
  display: inline-block;
  position: relative;
  z-index: 0;
}
.OP-annulus-rli-bounding-box .OP-annulus-indicator .whirl {
  animation: uxlv7n7 calc(var(--rli-animation-duration, 1.5s) * 1.33) linear infinite;
  height: 100%;
  transform-origin: center center;
  width: 100%;
  position: absolute;
  top: 0;
  bottom: 0;
  left: 0;
  right: 0;
  margin: auto;
}
.OP-annulus-rli-bounding-box .OP-annulus-indicator .path {
  stroke-dasharray: 1, 125;
  stroke-dashoffset: 0;
  animation: var(--rli-animation-duration, 1.5s) var(--rli-animation-function, ease-in-out) infinite uxlv7oa, calc(var(--rli-animation-duration, 1.5s) * 4) var(--rli-animation-function, ease-in-out) infinite uxlv7p5;
  stroke-linecap: round;
}
.OP-annulus-rli-bounding-box .OP-annulus-text {
  mix-blend-mode: difference;
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  z-index: -2;
}

@property --OP-annulus-phase1-color {
  syntax: "<color>";
  inherits: true;
  initial-value: rgb(50, 205, 50);
}
@property --OP-annulus-phase2-color {
  syntax: "<color>";
  inherits: true;
  initial-value: rgb(50, 205, 50);
}
@property --OP-annulus-phase3-color {
  syntax: "<color>";
  inherits: true;
  initial-value: rgb(50, 205, 50);
}
@property --OP-annulus-phase4-color {
  syntax: "<color>";
  inherits: true;
  initial-value: rgb(50, 205, 50);
}
@property --rli-animation-duration {
  syntax: "<time>";
  inherits: true;
  initial-value: 1.5s;
}
@keyframes uxlv7n7 {
  100% {
    transform: rotate(360deg);
  }
}
@keyframes uxlv7oa {
  0% {
    stroke-dasharray: 1, 125;
    stroke-dashoffset: 0;
  }
  50% {
    stroke-dasharray: 98, 125;
    stroke-dashoffset: -35px;
  }
  100% {
    stroke-dasharray: 98, 125;
    stroke-dashoffset: -124px;
  }
}
@keyframes uxlv7p5 {
  100%, 0% {
    stroke: var(--OP-annulus-phase1-color);
  }
  22% {
    stroke: var(--OP-annulus-phase1-color);
  }
  25% {
    stroke: var(--OP-annulus-phase2-color, var(--OP-annulus-phase1-color));
  }
  42% {
    stroke: var(--OP-annulus-phase2-color, var(--OP-annulus-phase1-color));
  }
  50% {
    stroke: var(--OP-annulus-phase3-color, var(--OP-annulus-phase1-color));
  }
  72% {
    stroke: var(--OP-annulus-phase3-color, var(--OP-annulus-phase1-color));
  }
  75% {
    stroke: var(--OP-annulus-phase4-color, var(--OP-annulus-phase1-color));
  }
  97% {
    stroke: var(--OP-annulus-phase4-color, var(--OP-annulus-phase1-color));
  }
}`);Array.from({length:4},(function(l,s){return"--OP-annulus-phase".concat(s+1,"-color")}));function oa(l){return l&&l.Math===Math&&l}ye(`.OP-dotted-rli-bounding-box {
  --OP-dotted-phase1-color: rgb(50, 205, 50);
  font-size: 16px;
  box-sizing: border-box;
  display: inline-block;
}
.OP-dotted-rli-bounding-box .OP-dotted-indicator {
  width: 5em;
  height: 5em;
  color: var(--OP-dotted-phase1-color);
  display: inline-block;
  position: relative;
  z-index: 0;
}
.OP-dotted-rli-bounding-box .OP-dotted-indicator .OP-dotted-text {
  mix-blend-mode: difference;
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  z-index: -2;
}
.OP-dotted-rli-bounding-box .OP-dotted-indicator .dot-shape-holder {
  position: absolute;
  left: 0;
  top: 0;
  bottom: 0;
  right: 0;
}
.OP-dotted-rli-bounding-box .OP-dotted-indicator .dot-shape-holder .dot {
  display: block;
  margin: 0 auto;
  width: 15%;
  height: 15%;
  background-color: currentColor;
  border-radius: 50%;
  animation: var(--rli-animation-duration, 1.2s) var(--rli-animation-function, ease-in-out) infinite uxlv7nu, calc(var(--rli-animation-duration, 1.2s) * 4) var(--rli-animation-function, ease-in-out) infinite uxlv7ol;
}
.OP-dotted-rli-bounding-box .OP-dotted-indicator .dot-shape-holder:nth-of-type(1) {
  transform: rotate(0deg);
}
.OP-dotted-rli-bounding-box .OP-dotted-indicator .dot-shape-holder:nth-of-type(1) .dot {
  animation-delay: calc(var(--rli-animation-duration, 1.2s) / 12 * 12 * -1);
}
.OP-dotted-rli-bounding-box .OP-dotted-indicator .dot-shape-holder:nth-of-type(2) {
  transform: rotate(30deg);
}
.OP-dotted-rli-bounding-box .OP-dotted-indicator .dot-shape-holder:nth-of-type(2) .dot {
  animation-delay: calc(var(--rli-animation-duration, 1.2s) / 12 * 11 * -1);
}
.OP-dotted-rli-bounding-box .OP-dotted-indicator .dot-shape-holder:nth-of-type(3) {
  transform: rotate(60deg);
}
.OP-dotted-rli-bounding-box .OP-dotted-indicator .dot-shape-holder:nth-of-type(3) .dot {
  animation-delay: calc(var(--rli-animation-duration, 1.2s) / 12 * 10 * -1);
}
.OP-dotted-rli-bounding-box .OP-dotted-indicator .dot-shape-holder:nth-of-type(4) {
  transform: rotate(90deg);
}
.OP-dotted-rli-bounding-box .OP-dotted-indicator .dot-shape-holder:nth-of-type(4) .dot {
  animation-delay: calc(var(--rli-animation-duration, 1.2s) / 12 * 9 * -1);
}
.OP-dotted-rli-bounding-box .OP-dotted-indicator .dot-shape-holder:nth-of-type(5) {
  transform: rotate(120deg);
}
.OP-dotted-rli-bounding-box .OP-dotted-indicator .dot-shape-holder:nth-of-type(5) .dot {
  animation-delay: calc(var(--rli-animation-duration, 1.2s) / 12 * 8 * -1);
}
.OP-dotted-rli-bounding-box .OP-dotted-indicator .dot-shape-holder:nth-of-type(6) {
  transform: rotate(150deg);
}
.OP-dotted-rli-bounding-box .OP-dotted-indicator .dot-shape-holder:nth-of-type(6) .dot {
  animation-delay: calc(var(--rli-animation-duration, 1.2s) / 12 * 7 * -1);
}
.OP-dotted-rli-bounding-box .OP-dotted-indicator .dot-shape-holder:nth-of-type(7) {
  transform: rotate(180deg);
}
.OP-dotted-rli-bounding-box .OP-dotted-indicator .dot-shape-holder:nth-of-type(7) .dot {
  animation-delay: calc(var(--rli-animation-duration, 1.2s) / 12 * 6 * -1);
}
.OP-dotted-rli-bounding-box .OP-dotted-indicator .dot-shape-holder:nth-of-type(8) {
  transform: rotate(210deg);
}
.OP-dotted-rli-bounding-box .OP-dotted-indicator .dot-shape-holder:nth-of-type(8) .dot {
  animation-delay: calc(var(--rli-animation-duration, 1.2s) / 12 * 5 * -1);
}
.OP-dotted-rli-bounding-box .OP-dotted-indicator .dot-shape-holder:nth-of-type(9) {
  transform: rotate(240deg);
}
.OP-dotted-rli-bounding-box .OP-dotted-indicator .dot-shape-holder:nth-of-type(9) .dot {
  animation-delay: calc(var(--rli-animation-duration, 1.2s) / 12 * 4 * -1);
}
.OP-dotted-rli-bounding-box .OP-dotted-indicator .dot-shape-holder:nth-of-type(10) {
  transform: rotate(270deg);
}
.OP-dotted-rli-bounding-box .OP-dotted-indicator .dot-shape-holder:nth-of-type(10) .dot {
  animation-delay: calc(var(--rli-animation-duration, 1.2s) / 12 * 3 * -1);
}
.OP-dotted-rli-bounding-box .OP-dotted-indicator .dot-shape-holder:nth-of-type(11) {
  transform: rotate(300deg);
}
.OP-dotted-rli-bounding-box .OP-dotted-indicator .dot-shape-holder:nth-of-type(11) .dot {
  animation-delay: calc(var(--rli-animation-duration, 1.2s) / 12 * 2 * -1);
}
.OP-dotted-rli-bounding-box .OP-dotted-indicator .dot-shape-holder:nth-of-type(12) {
  transform: rotate(330deg);
}
.OP-dotted-rli-bounding-box .OP-dotted-indicator .dot-shape-holder:nth-of-type(12) .dot {
  animation-delay: calc(var(--rli-animation-duration, 1.2s) / 12 * 1 * -1);
}

@property --OP-dotted-phase1-color {
  syntax: "<color>";
  inherits: true;
  initial-value: rgb(50, 205, 50);
}
@property --OP-dotted-phase2-color {
  syntax: "<color>";
  inherits: true;
  initial-value: rgb(50, 205, 50);
}
@property --OP-dotted-phase3-color {
  syntax: "<color>";
  inherits: true;
  initial-value: rgb(50, 205, 50);
}
@property --OP-dotted-phase4-color {
  syntax: "<color>";
  inherits: true;
  initial-value: rgb(50, 205, 50);
}
@property --rli-animation-duration {
  syntax: "<time>";
  inherits: true;
  initial-value: 1.2s;
}
@keyframes uxlv7nu {
  0%, 39%, 100% {
    opacity: 0;
  }
  40% {
    opacity: 1;
  }
}
@keyframes uxlv7ol {
  100%, 0% {
    background-color: var(--OP-dotted-phase1-color);
  }
  22% {
    background-color: var(--OP-dotted-phase1-color);
  }
  25% {
    background-color: var(--OP-dotted-phase2-color, var(--OP-dotted-phase1-color));
  }
  47% {
    background-color: var(--OP-dotted-phase2-color, var(--OP-dotted-phase1-color));
  }
  50% {
    background-color: var(--OP-dotted-phase3-color, var(--OP-dotted-phase1-color));
  }
  72% {
    background-color: var(--OP-dotted-phase3-color, var(--OP-dotted-phase1-color));
  }
  75% {
    background-color: var(--OP-dotted-phase4-color, var(--OP-dotted-phase1-color));
  }
  97% {
    background-color: var(--OP-dotted-phase4-color, var(--OP-dotted-phase1-color));
  }
}`);oa(typeof window=="object"&&window)||oa(typeof self=="object"&&self)||oa(typeof global=="object"&&global)||(function(){return this})()||Function("return this")();Array.from({length:4},(function(l,s){return"--OP-dotted-phase".concat(s+1,"-color")}));ye(`.OP-spokes-rli-bounding-box {
  --OP-spokes-phase1-color: rgb(50, 205, 50);
  font-size: 16px;
  position: relative;
  color: var(--OP-spokes-phase1-color);
}
.OP-spokes-rli-bounding-box .OP-spokes-indicator {
  width: 4.8em;
  height: 4.8em;
  display: block;
  position: relative;
}
.OP-spokes-rli-bounding-box .OP-spokes-indicator .spoke {
  position: absolute;
  height: 1.2em;
  width: 0.4em;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  margin: auto auto auto 50%;
  background-color: var(--OP-spokes-phase1-color);
  border-radius: 0.24em;
  opacity: 0;
  animation: var(--rli-animation-duration, 1.2s) var(--rli-animation-function, ease-in-out) backwards infinite uxlv7pw, calc(var(--rli-animation-duration, 1.2s) * 4) var(--rli-animation-function, ease-in-out) infinite uxlv7qn;
  transform-origin: left center;
}
.OP-spokes-rli-bounding-box .OP-spokes-indicator .spoke:nth-of-type(1) {
  transform: rotate(calc(0 * 360deg / 12)) translate(-50%, -1.56em);
  animation-delay: calc(11 * var(--rli-animation-duration, 1.2s) / 12 * -1);
}
.OP-spokes-rli-bounding-box .OP-spokes-indicator .spoke:nth-of-type(2) {
  transform: rotate(calc(1 * 360deg / 12)) translate(-50%, -1.56em);
  animation-delay: calc(10 * var(--rli-animation-duration, 1.2s) / 12 * -1);
}
.OP-spokes-rli-bounding-box .OP-spokes-indicator .spoke:nth-of-type(3) {
  transform: rotate(calc(2 * 360deg / 12)) translate(-50%, -1.56em);
  animation-delay: calc(9 * var(--rli-animation-duration, 1.2s) / 12 * -1);
}
.OP-spokes-rli-bounding-box .OP-spokes-indicator .spoke:nth-of-type(4) {
  transform: rotate(calc(3 * 360deg / 12)) translate(-50%, -1.56em);
  animation-delay: calc(8 * var(--rli-animation-duration, 1.2s) / 12 * -1);
}
.OP-spokes-rli-bounding-box .OP-spokes-indicator .spoke:nth-of-type(5) {
  transform: rotate(calc(4 * 360deg / 12)) translate(-50%, -1.56em);
  animation-delay: calc(7 * var(--rli-animation-duration, 1.2s) / 12 * -1);
}
.OP-spokes-rli-bounding-box .OP-spokes-indicator .spoke:nth-of-type(6) {
  transform: rotate(calc(5 * 360deg / 12)) translate(-50%, -1.56em);
  animation-delay: calc(6 * var(--rli-animation-duration, 1.2s) / 12 * -1);
}
.OP-spokes-rli-bounding-box .OP-spokes-indicator .spoke:nth-of-type(7) {
  transform: rotate(calc(6 * 360deg / 12)) translate(-50%, -1.56em);
  animation-delay: calc(5 * var(--rli-animation-duration, 1.2s) / 12 * -1);
}
.OP-spokes-rli-bounding-box .OP-spokes-indicator .spoke:nth-of-type(8) {
  transform: rotate(calc(7 * 360deg / 12)) translate(-50%, -1.56em);
  animation-delay: calc(4 * var(--rli-animation-duration, 1.2s) / 12 * -1);
}
.OP-spokes-rli-bounding-box .OP-spokes-indicator .spoke:nth-of-type(9) {
  transform: rotate(calc(8 * 360deg / 12)) translate(-50%, -1.56em);
  animation-delay: calc(3 * var(--rli-animation-duration, 1.2s) / 12 * -1);
}
.OP-spokes-rli-bounding-box .OP-spokes-indicator .spoke:nth-of-type(10) {
  transform: rotate(calc(9 * 360deg / 12)) translate(-50%, -1.56em);
  animation-delay: calc(2 * var(--rli-animation-duration, 1.2s) / 12 * -1);
}
.OP-spokes-rli-bounding-box .OP-spokes-indicator .spoke:nth-of-type(11) {
  transform: rotate(calc(10 * 360deg / 12)) translate(-50%, -1.56em);
  animation-delay: calc(1 * var(--rli-animation-duration, 1.2s) / 12 * -1);
}
.OP-spokes-rli-bounding-box .OP-spokes-indicator .spoke:nth-of-type(12) {
  transform: rotate(calc(11 * 360deg / 12)) translate(-50%, -1.56em);
  animation-delay: calc(0 * var(--rli-animation-duration, 1.2s) / 12 * -1);
}
.OP-spokes-rli-bounding-box .OP-spokes-indicator-text {
  mix-blend-mode: difference;
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  color: var(--OP-spokes-phase1-color);
  z-index: -2;
}

@property --OP-spokes-phase1-color {
  syntax: "<color>";
  inherits: true;
  initial-value: rgb(50, 205, 50);
}
@property --OP-spokes-phase2-color {
  syntax: "<color>";
  inherits: true;
  initial-value: rgb(50, 205, 50);
}
@property --OP-spokes-phase3-color {
  syntax: "<color>";
  inherits: true;
  initial-value: rgb(50, 205, 50);
}
@property --OP-spokes-phase4-color {
  syntax: "<color>";
  inherits: true;
  initial-value: rgb(50, 205, 50);
}
@property --rli-animation-duration {
  syntax: "<time>";
  inherits: true;
  initial-value: 1.2s;
}
@keyframes uxlv7pw {
  from {
    opacity: 1;
  }
  to {
    opacity: 0;
  }
}
@keyframes uxlv7qn {
  100%, 0% {
    background-color: var(--OP-spokes-phase1-color);
  }
  22% {
    background-color: var(--OP-spokes-phase1-color);
  }
  25% {
    background-color: var(--OP-spokes-phase2-color, var(--OP-spokes-phase1-color));
  }
  42% {
    background-color: var(--OP-spokes-phase2-color, var(--OP-spokes-phase1-color));
  }
  50% {
    background-color: var(--OP-spokes-phase3-color, var(--OP-spokes-phase1-color));
  }
  72% {
    background-color: var(--OP-spokes-phase3-color, var(--OP-spokes-phase1-color));
  }
  75% {
    background-color: var(--OP-spokes-phase4-color, var(--OP-spokes-phase1-color));
  }
  97% {
    background-color: var(--OP-spokes-phase4-color, var(--OP-spokes-phase1-color));
  }
}`);Array.from({length:4},(function(l,s){return"--OP-spokes-phase".concat(s+1,"-color")}));ye(`.OP-annulus-dual-sectors-rli-bounding-box {
  --OP-annulus-dual-sectors-phase1-color: rgb(50, 205, 50);
  font-size: 16px;
  box-sizing: border-box;
  display: inline-block;
}
.OP-annulus-dual-sectors-rli-bounding-box .OP-annulus-dual-sectors-indicator {
  width: 5em;
  height: 5em;
  display: inline-block;
  position: relative;
  z-index: 0;
  color: var(--OP-annulus-dual-sectors-phase1-color);
}
.OP-annulus-dual-sectors-rli-bounding-box .OP-annulus-dual-sectors-indicator .annulus-sectors {
  box-sizing: border-box;
  width: 100%;
  height: 100%;
  border-radius: 50%;
  border-width: 0.34em;
  border-style: solid;
  border-color: var(--OP-annulus-dual-sectors-phase1-color) transparent var(--OP-annulus-dual-sectors-phase1-color) transparent;
  background-color: transparent;
  animation: var(--rli-animation-duration, 1.2s) var(--rli-animation-function, linear) infinite uxlv7ra, calc(var(--rli-animation-duration, 1.2s) * 4) var(--rli-animation-function, linear) infinite uxlv7sv;
}
.OP-annulus-dual-sectors-rli-bounding-box .OP-annulus-dual-sectors-indicator .OP-annulus-dual-sectors-text {
  mix-blend-mode: difference;
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  z-index: -2;
}

@property --OP-annulus-dual-sectors-phase1-color {
  syntax: "<color>";
  inherits: true;
  initial-value: rgb(50, 205, 50);
}
@property --OP-annulus-dual-sectors-phase2-color {
  syntax: "<color>";
  inherits: true;
  initial-value: rgb(50, 205, 50);
}
@property --OP-annulus-dual-sectors-phase3-color {
  syntax: "<color>";
  inherits: true;
  initial-value: rgb(50, 205, 50);
}
@property --OP-annulus-dual-sectors-phase4-color {
  syntax: "<color>";
  inherits: true;
  initial-value: rgb(50, 205, 50);
}
@property --rli-animation-duration {
  syntax: "<time>";
  inherits: true;
  initial-value: 1.2s;
}
@keyframes uxlv7ra {
  0% {
    transform: rotate(0deg);
  }
  100% {
    transform: rotate(360deg);
  }
}
@keyframes uxlv7sv {
  100%, 0% {
    border-color: var(--OP-annulus-dual-sectors-phase1-color) transparent;
  }
  20% {
    border-color: var(--OP-annulus-dual-sectors-phase1-color) transparent;
  }
  25% {
    border-color: var(--OP-annulus-dual-sectors-phase2-color, var(--OP-annulus-dual-sectors-phase1-color)) transparent;
  }
  45% {
    border-color: var(--OP-annulus-dual-sectors-phase2-color, var(--OP-annulus-dual-sectors-phase1-color)) transparent;
  }
  50% {
    border-color: var(--OP-annulus-dual-sectors-phase3-color, var(--OP-annulus-dual-sectors-phase1-color)) transparent;
  }
  70% {
    border-color: var(--OP-annulus-dual-sectors-phase3-color, var(--OP-annulus-dual-sectors-phase1-color)) transparent;
  }
  75% {
    border-color: var(--OP-annulus-dual-sectors-phase4-color, var(--OP-annulus-dual-sectors-phase1-color)) transparent;
  }
  95% {
    border-color: var(--OP-annulus-dual-sectors-phase4-color, var(--OP-annulus-dual-sectors-phase1-color)) transparent;
  }
}`);Array.from({length:4},(function(l,s){return"--OP-annulus-dual-sectors-phase".concat(s+1,"-color")}));ye(`.OP-annulus-sector-track-rli-bounding-box {
  --OP-annulus-track-phase1-color: rgba(50, 205, 50, 0.22);
  --OP-annulus-sector-phase1-color: rgb(50, 205, 50);
  font-size: 16px;
  display: inline-block;
}
.OP-annulus-sector-track-rli-bounding-box .OP-annulus-sector-track-indicator {
  width: 5em;
  height: 5em;
  color: var(--OP-annulus-sector-phase1-color);
  display: inline-block;
  position: relative;
  z-index: 0;
}
.OP-annulus-sector-track-rli-bounding-box .OP-annulus-sector-track-indicator .annulus-track-ring {
  width: 100%;
  height: 100%;
  border-width: 0.34em;
  border-style: solid;
  border-radius: 50%;
  box-sizing: border-box;
  border-color: var(--OP-annulus-track-phase1-color);
  border-top-color: var(--OP-annulus-sector-phase1-color);
  animation: var(--rli-animation-duration, 1s) var(--rli-animation-function, linear) infinite uxlv7rl, calc(var(--rli-animation-duration, 1s) * 4) var(--rli-animation-function, linear) infinite uxlv7tf;
}
.OP-annulus-sector-track-rli-bounding-box .OP-annulus-sector-track-indicator .OP-annulus-sector-text {
  mix-blend-mode: difference;
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  z-index: -2;
}

@property --OP-annulus-track-phase1-color {
  syntax: "<color>";
  inherits: true;
  initial-value: rgba(50, 205, 50, 0.22);
}
@property --OP-annulus-track-phase2-color {
  syntax: "<color>";
  inherits: true;
  initial-value: rgba(50, 205, 50, 0.22);
}
@property --OP-annulus-track-phase3-color {
  syntax: "<color>";
  inherits: true;
  initial-value: rgba(50, 205, 50, 0.22);
}
@property --OP-annulus-track-phase4-color {
  syntax: "<color>";
  inherits: true;
  initial-value: rgba(50, 205, 50, 0.22);
}
@property --OP-annulus-sector-phase1-color {
  syntax: "<color>";
  inherits: true;
  initial-value: rgb(50, 205, 50);
}
@property --OP-annulus-sector-phase2-color {
  syntax: "<color>";
  inherits: true;
  initial-value: rgb(50, 205, 50);
}
@property --OP-annulus-sector-phase3-color {
  syntax: "<color>";
  inherits: true;
  initial-value: rgb(50, 205, 50);
}
@property --OP-annulus-sector-phase4-color {
  syntax: "<color>";
  inherits: true;
  initial-value: rgb(50, 205, 50);
}
@property --rli-animation-duration {
  syntax: "<time>";
  inherits: true;
  initial-value: 1s;
}
@keyframes uxlv7rl {
  to {
    transform: rotate(1turn);
  }
}
@keyframes uxlv7tf {
  100%, 0% {
    border-color: var(--OP-annulus-track-phase1-color);
    border-top-color: var(--OP-annulus-sector-phase1-color);
  }
  18% {
    border-color: var(--OP-annulus-track-phase1-color);
    border-top-color: var(--OP-annulus-sector-phase1-color);
  }
  25% {
    border-color: var(--OP-annulus-track-phase2-color, var(--OP-annulus-track-phase1-color));
    border-top-color: var(--OP-annulus-sector-phase2-color, var(--OP-annulus-sector-phase1-color));
  }
  43% {
    border-color: var(--OP-annulus-track-phase2-color, var(--OP-annulus-track-phase1-color));
    border-top-color: var(--OP-annulus-sector-phase2-color, var(--OP-annulus-sector-phase1-color));
  }
  50% {
    border-color: var(--OP-annulus-track-phase3-color, var(--OP-annulus-track-phase1-color));
    border-top-color: var(--OP-annulus-sector-phase3-color, var(--OP-annulus-sector-phase1-color));
  }
  68% {
    border-color: var(--OP-annulus-track-phase3-color, var(--OP-annulus-track-phase1-color));
    border-top-color: var(--OP-annulus-sector-phase3-color, var(--OP-annulus-sector-phase1-color));
  }
  75% {
    border-color: var(--OP-annulus-track-phase4-color, var(--OP-annulus-track-phase1-color));
    border-top-color: var(--OP-annulus-sector-phase4-color, var(--OP-annulus-sector-phase1-color));
  }
  93% {
    border-color: var(--OP-annulus-track-phase4-color, var(--OP-annulus-track-phase1-color));
    border-top-color: var(--OP-annulus-sector-phase4-color, var(--OP-annulus-sector-phase1-color));
  }
}`);Array.from({length:4},(function(l,s){return["--OP-annulus-track-phase".concat(s+1,"-color"),"--OP-annulus-sector-phase".concat(s+1,"-color")]}));ye(`.foursquare-rli-bounding-box {
  --four-square-phase1-color: rgb(50, 205, 50);
  font-size: 16px;
  box-sizing: border-box;
  color: var(--four-square-phase1-color);
  display: inline-block;
  overflow: hidden;
}
.foursquare-rli-bounding-box .foursquare-indicator {
  height: 5.3033008589em;
  width: 5.3033008589em;
  position: relative;
  display: block;
}
.foursquare-rli-bounding-box .foursquare-indicator .squares-container {
  position: absolute;
  z-index: 0;
  top: 0;
  right: 0;
  bottom: 0;
  left: 0;
  margin: auto;
  height: 2.5em;
  width: 2.5em;
  color: inherit;
  will-change: color, width, height;
  transform: rotate(45deg);
  animation: var(--rli-animation-duration, 1s) var(--rli-animation-function, cubic-bezier(0.05, 0.28, 0.79, 0.98)) infinite uxlv7dk, calc(var(--rli-animation-duration, 1s) * 4) var(--rli-animation-function, cubic-bezier(0.05, 0.28, 0.79, 0.98)) infinite uxlv7es;
}
.foursquare-rli-bounding-box .foursquare-indicator .squares-container .square {
  position: absolute;
  width: 1.25em;
  height: 1.25em;
  border-radius: 0.1875em;
  background-color: currentColor;
  animation: uxlv7dd var(--rli-animation-duration, 1s) var(--rli-animation-function, cubic-bezier(0.05, 0.28, 0.79, 0.98)) both infinite;
}
.foursquare-rli-bounding-box .foursquare-indicator .squares-container .square.square1 {
  top: 0;
  left: 0;
}
.foursquare-rli-bounding-box .foursquare-indicator .squares-container .square.square2 {
  top: 0;
  right: 0;
}
.foursquare-rli-bounding-box .foursquare-indicator .squares-container .square.square3 {
  bottom: 0;
  left: 0;
}
.foursquare-rli-bounding-box .foursquare-indicator .squares-container .square.square4 {
  bottom: 0;
  right: 0;
}

@property --four-square-phase1-color {
  syntax: "<color>";
  inherits: true;
  initial-value: rgb(50, 205, 50);
}
@property --four-square-phase2-color {
  syntax: "<color>";
  inherits: true;
  initial-value: rgb(50, 205, 50);
}
@property --four-square-phase3-color {
  syntax: "<color>";
  inherits: true;
  initial-value: rgb(50, 205, 50);
}
@property --four-square-phase4-color {
  syntax: "<color>";
  inherits: true;
  initial-value: rgb(50, 205, 50);
}
@property --rli-animation-duration {
  syntax: "<time>";
  inherits: true;
  initial-value: 1s;
}
@keyframes uxlv7dk {
  0% {
    width: 2.5em;
    height: 2.5em;
  }
  10% {
    width: 2.5em;
    height: 2.5em;
  }
  50% {
    width: 3.75em;
    height: 3.75em;
  }
  90% {
    width: 2.5em;
    height: 2.5em;
  }
  100% {
    width: 2.5em;
    height: 2.5em;
  }
}
@keyframes uxlv7dd {
  0% {
    transform: rotateZ(0deg);
  }
  10% {
    transform: rotateZ(0deg);
  }
  50% {
    transform: rotateZ(90deg);
  }
  90% {
    transform: rotateZ(90deg);
  }
  100% {
    transform: rotateZ(90deg);
  }
}
@keyframes uxlv7es {
  100%, 0% {
    color: var(--four-square-phase1-color);
  }
  20% {
    color: var(--four-square-phase1-color);
  }
  25% {
    color: var(--four-square-phase2-color, var(--four-square-phase1-color));
  }
  45% {
    color: var(--four-square-phase2-color, var(--four-square-phase1-color));
  }
  50% {
    color: var(--four-square-phase3-color, var(--four-square-phase1-color));
  }
  70% {
    color: var(--four-square-phase3-color, var(--four-square-phase1-color));
  }
  75% {
    color: var(--four-square-phase4-color, var(--four-square-phase1-color));
  }
  95% {
    color: var(--four-square-phase4-color, var(--four-square-phase1-color));
  }
}`);Array.from({length:4},(function(l,s){return"--four-square-phase".concat(s+1,"-color")}));ye(`.mosaic-rli-bounding-box {
  --mosaic-phase1-color: rgb(50, 205, 50);
  box-sizing: border-box;
  font-size: 16px;
  color: var(--mosaic-phase1-color);
}
.mosaic-rli-bounding-box .mosaic-indicator {
  width: 5em;
  height: 5em;
  color: currentColor;
  display: grid;
  gap: 0.125em;
  grid-template-columns: repeat(3, 1fr);
  grid-template-areas: "a b c" "d e f" "g h i";
  position: relative;
  z-index: 0;
}
.mosaic-rli-bounding-box .mosaic-indicator .mosaic-cube-text {
  mix-blend-mode: difference;
  position: absolute;
  top: 105%;
  left: 50%;
  transform: translateX(-50%);
  z-index: -2;
}
.mosaic-rli-bounding-box .mosaic-indicator .mosaic-cube {
  background-color: var(--mosaic-phase1-color);
  animation-name: uxlv7i4, uxlv7is;
  animation-duration: var(--rli-animation-duration, 1.5s), calc(var(--rli-animation-duration, 1.5s) * 4);
  animation-timing-function: var(--rli-animation-function, ease-in-out);
  animation-iteration-count: infinite;
}
.mosaic-rli-bounding-box .mosaic-indicator .mosaic-cube1 {
  animation-delay: calc(var(--mosaic-skip-interval, 0.1s) * 2);
  grid-area: a;
}
.mosaic-rli-bounding-box .mosaic-indicator .mosaic-cube2 {
  animation-delay: calc(var(--mosaic-skip-interval, 0.1s) * 3);
  grid-area: b;
}
.mosaic-rli-bounding-box .mosaic-indicator .mosaic-cube3 {
  grid-area: c;
  animation-delay: calc(var(--mosaic-skip-interval, 0.1s) * 4);
}
.mosaic-rli-bounding-box .mosaic-indicator .mosaic-cube4 {
  grid-area: d;
  animation-delay: calc(var(--mosaic-skip-interval, 0.1s) * 1);
}
.mosaic-rli-bounding-box .mosaic-indicator .mosaic-cube5 {
  grid-area: e;
  animation-delay: calc(var(--mosaic-skip-interval, 0.1s) * 2);
}
.mosaic-rli-bounding-box .mosaic-indicator .mosaic-cube6 {
  grid-area: f;
  animation-delay: calc(var(--mosaic-skip-interval, 0.1s) * 3);
}
.mosaic-rli-bounding-box .mosaic-indicator .mosaic-cube7 {
  grid-area: g;
  animation-delay: 0s;
}
.mosaic-rli-bounding-box .mosaic-indicator .mosaic-cube8 {
  grid-area: h;
  animation-delay: calc(var(--mosaic-skip-interval, 0.1s) * 1);
}
.mosaic-rli-bounding-box .mosaic-indicator .mosaic-cube9 {
  grid-area: i;
  animation-delay: calc(var(--mosaic-skip-interval, 0.1s) * 2);
}

@property --mosaic-phase1-color {
  syntax: "<color>";
  inherits: true;
  initial-value: rgb(50, 205, 50);
}
@property --mosaic-phase2-color {
  syntax: "<color>";
  inherits: true;
  initial-value: rgb(50, 205, 50);
}
@property --mosaic-phase3-color {
  syntax: "<color>";
  inherits: true;
  initial-value: rgb(50, 205, 50);
}
@property --mosaic-phase4-color {
  syntax: "<color>";
  inherits: true;
  initial-value: rgb(50, 205, 50);
}
@property --rli-animation-duration {
  syntax: "<time>";
  inherits: true;
  initial-value: 1.5s;
}
@keyframes uxlv7i4 {
  0%, 60%, 100% {
    transform: scale3D(1, 1, 1);
  }
  30% {
    transform: scale3D(0, 0, 1);
  }
}
@keyframes uxlv7is {
  100%, 0% {
    background-color: var(--mosaic-phase1-color);
  }
  25% {
    background-color: var(--mosaic-phase2-color, var(--mosaic-phase1-color));
  }
  50% {
    background-color: var(--mosaic-phase3-color, var(--mosaic-phase1-color));
  }
  75% {
    background-color: var(--mosaic-phase4-color, var(--mosaic-phase1-color));
  }
}`);Array.from({length:4},(function(l,s){return"--mosaic-phase".concat(s+1,"-color")}));ye(`.riple-rli-bounding-box {
  --riple-phase1-color: rgb(50, 205, 50);
  box-sizing: border-box;
  font-size: 16px;
  display: inline-block;
  color: var(--riple-phase1-color);
}
.riple-rli-bounding-box .riple-indicator {
  display: inline-block;
  width: 5em;
  height: 5em;
  position: relative;
  z-index: 0;
}
.riple-rli-bounding-box .riple-indicator .riple-text {
  mix-blend-mode: difference;
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  z-index: -2;
}
.riple-rli-bounding-box .riple-indicator .riple {
  --border-width: 0.25em;
  position: absolute;
  border: var(--border-width) solid var(--riple-phase1-color);
  opacity: 1;
  border-radius: 50%;
  will-change: top, right, left, bottom, border-color;
  animation: var(--rli-animation-duration, 1s) var(--rli-animation-function, cubic-bezier(0, 0.2, 0.8, 1)) infinite uxlv7i1, calc(var(--rli-animation-duration, 1s) * 4) var(--rli-animation-function, cubic-bezier(0, 0.2, 0.8, 1)) infinite uxlv7io;
}
.riple-rli-bounding-box .riple-indicator .riple:nth-of-type(2) {
  animation-delay: calc(var(--rli-animation-duration, 1s) / 2 * -1);
}

@property --riple-phase1-color {
  syntax: "<color>";
  inherits: true;
  initial-value: rgb(50, 205, 50);
}
@property --riple-phase2-color {
  syntax: "<color>";
  inherits: true;
  initial-value: rgb(50, 205, 50);
}
@property --riple-phase3-color {
  syntax: "<color>";
  inherits: true;
  initial-value: rgb(50, 205, 50);
}
@property --riple-phase4-color {
  syntax: "<color>";
  inherits: true;
  initial-value: rgb(50, 205, 50);
}
@property --rli-animation-duration {
  syntax: "<time>";
  inherits: true;
  initial-value: 1s;
}
@keyframes uxlv7i1 {
  0% {
    top: calc(50% - var(--border-width));
    left: calc(50% - var(--border-width));
    right: calc(50% - var(--border-width));
    bottom: calc(50% - var(--border-width));
    opacity: 0;
  }
  4.9% {
    top: calc(50% - var(--border-width));
    left: calc(50% - var(--border-width));
    right: calc(50% - var(--border-width));
    bottom: calc(50% - var(--border-width));
    opacity: 0;
  }
  5% {
    top: calc(50% - var(--border-width));
    left: calc(50% - var(--border-width));
    right: calc(50% - var(--border-width));
    bottom: calc(50% - var(--border-width));
    opacity: 1;
  }
  100% {
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    opacity: 0;
  }
}
@keyframes uxlv7io {
  100%, 0% {
    border-color: var(--riple-phase1-color);
  }
  24.9% {
    border-color: var(--riple-phase1-color);
  }
  25% {
    border-color: var(--riple-phase2-color, var(--riple-phase1-color));
  }
  49.9% {
    border-color: var(--riple-phase2-color, var(--riple-phase1-color));
  }
  50% {
    border-color: var(--riple-phase3-color, var(--riple-phase1-color));
  }
  74.9% {
    border-color: var(--riple-phase3-color, var(--riple-phase1-color));
  }
  75% {
    border-color: var(--riple-phase4-color, var(--riple-phase1-color));
  }
  99.9% {
    border-color: var(--riple-phase4-color, var(--riple-phase1-color));
  }
}`);Array.from({length:4},(function(l,s){return"--riple-phase".concat(s+1,"-color")}));ye(`.pulsate-rli-bounding-box {
  --TD-pulsate-phase1-color: rgb(50, 205, 50);
  font-size: 16px;
  display: inline-block;
  box-sizing: border-box;
  color: var(--TD-pulsate-phase1-color);
}
.pulsate-rli-bounding-box .pulsate-indicator {
  width: 4.4em;
  height: 1.1em;
  text-align: center;
  position: relative;
  z-index: 0;
  display: flex;
  justify-content: space-between;
  flex-wrap: nowrap;
  align-items: center;
}
.pulsate-rli-bounding-box .pulsate-indicator .pulsate-dot {
  width: 1.1em;
  height: 1.1em;
  border-radius: 50%;
  background-color: var(--TD-pulsate-phase1-color);
  transform: scale(0);
  animation: var(--rli-animation-duration, 1.2s) var(--rli-animation-function, ease-in-out) var(--delay) infinite uxlv7s0, calc(var(--rli-animation-duration, 1.2s) * 4) var(--rli-animation-function, ease-in-out) var(--delay) infinite uxlv7to;
}
.pulsate-rli-bounding-box .pulsate-indicator .pulsate-dot:nth-of-type(1) {
  --delay: calc(var(--rli-animation-duration, 1.2s) * 0.15 * -1);
}
.pulsate-rli-bounding-box .pulsate-indicator .pulsate-dot:nth-of-type(2) {
  --delay: calc(var(--rli-animation-duration, 1.2s) * 0);
}
.pulsate-rli-bounding-box .pulsate-indicator .pulsate-dot:nth-of-type(3) {
  --delay: calc(var(--rli-animation-duration, 1.2s) * 0.15);
}
.pulsate-rli-bounding-box .pulsate-text {
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  width: 80%;
  text-transform: uppercase;
  text-align: center;
  font-size: 0.6em;
  letter-spacing: 0.5px;
  font-family: sans-serif;
  mix-blend-mode: difference;
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  z-index: -2;
}

@property --TD-pulsate-phase1-color {
  syntax: "<color>";
  inherits: true;
  initial-value: rgb(50, 205, 50);
}
@property --TD-pulsate-phase2-color {
  syntax: "<color>";
  inherits: true;
  initial-value: rgb(50, 205, 50);
}
@property --TD-pulsate-phase3-color {
  syntax: "<color>";
  inherits: true;
  initial-value: rgb(50, 205, 50);
}
@property --TD-pulsate-phase4-color {
  syntax: "<color>";
  inherits: true;
  initial-value: rgb(50, 205, 50);
}
@property --rli-animation-duration {
  syntax: "<time>";
  inherits: true;
  initial-value: 1.2s;
}
@keyframes uxlv7s0 {
  0%, 90%, 100% {
    transform: scale(0);
  }
  40% {
    transform: scale(1);
  }
}
@keyframes uxlv7to {
  0%, 100% {
    background-color: var(--TD-pulsate-phase1-color);
  }
  24.9% {
    background-color: var(--TD-pulsate-phase1-color);
  }
  25% {
    background-color: var(--TD-pulsate-phase2-color, var(--TD-pulsate-phase1-color));
  }
  49.9% {
    background-color: var(--TD-pulsate-phase2-color, var(--TD-pulsate-phase1-color));
  }
  50% {
    background-color: var(--TD-pulsate-phase3-color, var(--TD-pulsate-phase1-color));
  }
  74.9% {
    background-color: var(--TD-pulsate-phase3-color, var(--TD-pulsate-phase1-color));
  }
  75% {
    background-color: var(--TD-pulsate-phase4-color, var(--TD-pulsate-phase1-color));
  }
  99.9% {
    background-color: var(--TD-pulsate-phase4-color, var(--TD-pulsate-phase1-color));
  }
}`);Array.from({length:4},(function(l,s){return"--TD-pulsate-phase".concat(s+1,"-color")}));ye(`.brick-stack-rli-bounding-box {
  --TD-brick-stack-phase1-color: rgb(50, 205, 50);
  box-sizing: border-box;
  font-size: 16px;
  display: inline-block;
  color: var(--TD-brick-stack-phase1-color);
}
.brick-stack-rli-bounding-box .brick-stack-indicator {
  width: 2.8em;
  height: 2.8em;
  position: relative;
  display: block;
  margin: 0 auto;
}
.brick-stack-rli-bounding-box .brick-stack {
  width: 100%;
  height: 100%;
  background: radial-gradient(circle closest-side, currentColor 0% 95%, rgba(0, 0, 0, 0) calc(95% + 1px)) 0 0/40% 40% no-repeat, radial-gradient(circle closest-side, currentColor 0% 95%, rgba(0, 0, 0, 0) calc(95% + 1px)) 0 100%/40% 40% no-repeat, radial-gradient(circle closest-side, currentColor 0% 95%, rgba(0, 0, 0, 0) calc(95% + 1px)) 100% 100%/40% 40% no-repeat;
  animation: var(--rli-animation-duration, 1s) var(--rli-animation-function, ease-out) infinite uxlv7tu, calc(var(--rli-animation-duration, 1s) * 4) var(--rli-animation-function, ease-out) infinite uxlv7us;
}

@property --TD-brick-stack-phase1-color {
  syntax: "<color>";
  inherits: true;
  initial-value: rgb(50, 205, 50);
}
@property --TD-brick-stack-phase2-color {
  syntax: "<color>";
  inherits: true;
  initial-value: rgb(50, 205, 50);
}
@property --TD-brick-stack-phase3-color {
  syntax: "<color>";
  inherits: true;
  initial-value: rgb(50, 205, 50);
}
@property --TD-brick-stack-phase4-color {
  syntax: "<color>";
  inherits: true;
  initial-value: rgb(50, 205, 50);
}
@property --rli-animation-duration {
  syntax: "<time>";
  inherits: true;
  initial-value: 1s;
}
@keyframes uxlv7tu {
  0% {
    background-position: 0 0, 0 100%, 100% 100%;
  }
  25% {
    background-position: 100% 0, 0 100%, 100% 100%;
  }
  50% {
    background-position: 100% 0, 0 0, 100% 100%;
  }
  75% {
    background-position: 100% 0, 0 0, 0 100%;
  }
  100% {
    background-position: 100% 100%, 0 0, 0 100%;
  }
}
@keyframes uxlv7us {
  100%, 0% {
    color: var(--TD-brick-stack-phase1-color);
  }
  20% {
    color: var(--TD-brick-stack-phase1-color);
  }
  25% {
    color: var(--TD-brick-stack-phase2-color, var(--TD-brick-stack-phase1-color));
  }
  45% {
    color: var(--TD-brick-stack-phase2-color, var(--TD-brick-stack-phase1-color));
  }
  50% {
    color: var(--TD-brick-stack-phase3-color, var(--TD-brick-stack-phase1-color));
  }
  70% {
    color: var(--TD-brick-stack-phase3-color, var(--TD-brick-stack-phase1-color));
  }
  75% {
    color: var(--TD-brick-stack-phase4-color, var(--TD-brick-stack-phase1-color));
  }
  95% {
    color: var(--TD-brick-stack-phase4-color, var(--TD-brick-stack-phase1-color));
  }
}`);Array.from({length:4},(function(l,s){return"--TD-brick-stack-phase".concat(s+1,"-color")}));ye(`.bob-rli-bounding-box {
  --TD-bob-phase1-color: rgb(50, 205, 50);
  box-sizing: border-box;
  font-size: 16px;
  display: inline-block;
  color: var(--TD-bob-phase1-color);
}
.bob-rli-bounding-box .bob-indicator {
  width: 4.4em;
  height: 2.2em;
  position: relative;
  display: block;
  margin: 0 auto;
}
.bob-rli-bounding-box .bob-indicator .bobbing,
.bob-rli-bounding-box .bob-indicator .bobbing::before,
.bob-rli-bounding-box .bob-indicator .bobbing::after {
  width: 1.1em;
  height: 100%;
  display: grid;
  animation: var(--rli-animation-duration, 1.2s) var(--rli-animation-function, linear) var(--delay) infinite uxlv7u0, calc(var(--rli-animation-duration, 1.2s) * 4) var(--rli-animation-function, linear) var(--delay) infinite uxlv7vq;
}
.bob-rli-bounding-box .bob-indicator .bobbing::before,
.bob-rli-bounding-box .bob-indicator .bobbing::after {
  content: "";
  grid-area: 1/1;
}
.bob-rli-bounding-box .bob-indicator .bobbing {
  --delay: calc(var(--rli-animation-duration, 1.2s) * 0.12 * -1);
  background: radial-gradient(circle closest-side at center, currentColor 0% 92%, rgba(0, 0, 0, 0) calc(92% + 1px)) 50% 50%/100% 50% no-repeat;
}
.bob-rli-bounding-box .bob-indicator .bobbing::before {
  --delay: calc(var(--rli-animation-duration, 1.2s) * 0);
  transform: translateX(150%);
  background: radial-gradient(circle closest-side at center, currentColor 0% 92%, rgba(0, 0, 0, 0) calc(92% + 1px)) 50% 50%/100% 50% no-repeat;
}
.bob-rli-bounding-box .bob-indicator .bobbing::after {
  --delay: calc(var(--rli-animation-duration, 1.2s) * 0.12);
  transform: translateX(300%);
  background: radial-gradient(circle closest-side at center, currentColor 0% 92%, rgba(0, 0, 0, 0) calc(92% + 1px)) 50% 50%/100% 50% no-repeat;
}

@property --TD-bob-phase1-color {
  syntax: "<color>";
  inherits: true;
  initial-value: rgb(50, 205, 50);
}
@property --TD-bob-phase2-color {
  syntax: "<color>";
  inherits: true;
  initial-value: rgb(50, 205, 50);
}
@property --TD-bob-phase3-color {
  syntax: "<color>";
  inherits: true;
  initial-value: rgb(50, 205, 50);
}
@property --TD-bob-phase4-color {
  syntax: "<color>";
  inherits: true;
  initial-value: rgb(50, 205, 50);
}
@property --rli-animation-duration {
  syntax: "<time>";
  inherits: true;
  initial-value: 1.2s;
}
@keyframes uxlv7u0 {
  100%, 0% {
    background-position: 50% 50%;
  }
  15% {
    background-position: 50% 10%;
  }
  30% {
    background-position: 50% 100%;
  }
  40% {
    background-position: 50% 0%;
  }
  50% {
    background-position: 50% 90%;
  }
  70% {
    background-position: 50% 10%;
  }
  98% {
    background-position: 50% 50%;
  }
}
@keyframes uxlv7vq {
  100%, 0% {
    color: var(--TD-bob-phase1-color);
  }
  22% {
    color: var(--TD-bob-phase1-color);
  }
  25% {
    color: var(--TD-bob-phase2-color, var(--TD-bob-phase1-color));
  }
  47% {
    color: var(--TD-bob-phase2-color, var(--TD-bob-phase1-color));
  }
  50% {
    color: var(--TD-bob-phase3-color, var(--TD-bob-phase1-color));
  }
  72% {
    color: var(--TD-bob-phase3-color, var(--TD-bob-phase1-color));
  }
  75% {
    color: var(--TD-bob-phase4-color, var(--TD-bob-phase1-color));
  }
  97% {
    color: var(--TD-bob-phase4-color, var(--TD-bob-phase1-color));
  }
}`);Array.from({length:4},(function(l,s){return"--TD-bob-phase".concat(s+1,"-color")}));ye(`.bounce-rli-bounding-box {
  --TD-bounce-phase1-color: rgb(50, 205, 50);
  font-size: 16px;
  color: var(--TD-bounce-phase1-color);
  display: inline-block;
  padding-bottom: 0.25125em;
}
.bounce-rli-bounding-box .wrapper {
  --dot1-delay: 0s;
  --dot1-x-offset: 0.55em;
  --dot2-delay: calc((var(--rli-animation-duration, 0.5s) + var(--rli-animation-duration, 0.5s) * 0.75) * -1);
  --dot2-x-offset: 2.2em;
  --dot3-delay: calc((var(--rli-animation-duration, 0.5s) + var(--rli-animation-duration, 0.5s) * 0.5) * -1);
  --dot3-x-offset: 3.85em;
  width: 5.5em;
  height: 3.125em;
  position: relative;
  display: block;
  margin: 0 auto;
}
.bounce-rli-bounding-box .wrapper .group {
  display: block;
  position: absolute;
  top: 0;
  right: 0;
  bottom: 0;
  left: 0;
}
.bounce-rli-bounding-box .wrapper .group .dot {
  width: 1.1em;
  height: 1.1em;
  position: absolute;
  border-radius: 50%;
  background-color: var(--TD-bounce-phase1-color);
  transform-origin: 50%;
  animation: var(--rli-animation-duration, 0.5s) var(--rli-animation-function, cubic-bezier(0.74, 0.1, 0.74, 1)) alternate infinite uxlv7wc, calc(var(--rli-animation-duration, 0.5s) * 4) var(--rli-animation-function, cubic-bezier(0.74, 0.1, 0.74, 1)) infinite uxlv7x6;
}
.bounce-rli-bounding-box .wrapper .group .dot:nth-of-type(1) {
  left: var(--dot1-x-offset);
  animation-delay: var(--dot1-delay), 0s;
}
.bounce-rli-bounding-box .wrapper .group .dot:nth-of-type(2) {
  left: var(--dot2-x-offset);
  animation-delay: var(--dot2-delay), 0s;
}
.bounce-rli-bounding-box .wrapper .group .dot:nth-of-type(3) {
  left: var(--dot3-x-offset);
  animation-delay: var(--dot3-delay), 0s;
}
.bounce-rli-bounding-box .wrapper .group .shadow {
  width: 1.1em;
  height: 0.22em;
  border-radius: 50%;
  background-color: rgba(0, 0, 0, 0.5);
  position: absolute;
  top: 101%;
  transform-origin: 50%;
  z-index: -1;
  filter: blur(1px);
  animation: var(--rli-animation-duration, 0.5s) var(--rli-animation-function, cubic-bezier(0.74, 0.1, 0.74, 1)) alternate infinite uxlv7ww;
}
.bounce-rli-bounding-box .wrapper .group .shadow:nth-of-type(1) {
  left: var(--dot1-x-offset);
  animation-delay: var(--dot1-delay);
}
.bounce-rli-bounding-box .wrapper .group .shadow:nth-of-type(2) {
  left: var(--dot2-x-offset);
  animation-delay: var(--dot2-delay);
}
.bounce-rli-bounding-box .wrapper .group .shadow:nth-of-type(3) {
  left: var(--dot3-x-offset);
  animation-delay: var(--dot3-delay);
}

@property --TD-bounce-phase1-color {
  syntax: "<color>";
  inherits: true;
  initial-value: rgb(50, 205, 50);
}
@property --TD-bounce-phase2-color {
  syntax: "<color>";
  inherits: true;
  initial-value: rgb(50, 205, 50);
}
@property --TD-bounce-phase3-color {
  syntax: "<color>";
  inherits: true;
  initial-value: rgb(50, 205, 50);
}
@property --TD-bounce-phase4-color {
  syntax: "<color>";
  inherits: true;
  initial-value: rgb(50, 205, 50);
}
@property --rli-animation-duration {
  syntax: "<time>";
  inherits: true;
  initial-value: 0.5s;
}
@keyframes uxlv7wc {
  0% {
    top: 0%;
  }
  60% {
    height: 1.25em;
    border-radius: 50%;
    transform: scaleX(1);
  }
  100% {
    top: 100%;
    height: 0.22em;
    transform: scaleX(1.5);
    filter: blur(0.4px);
  }
}
@keyframes uxlv7ww {
  0% {
    transform: scaleX(0.2);
    opacity: 0.2;
  }
  60% {
    opacity: 0.4;
  }
  100% {
    transform: scaleX(1.5);
    opacity: 0.6;
  }
}
@keyframes uxlv7x6 {
  0%, 100% {
    background-color: var(--TD-bounce-phase1-color);
  }
  20% {
    background-color: var(--TD-bounce-phase1-color);
  }
  25% {
    background-color: var(--TD-bounce-phase2-color, var(--TD-bounce-phase1-color));
  }
  45% {
    background-color: var(--TD-bounce-phase2-color, var(--TD-bounce-phase1-color));
  }
  50% {
    background-color: var(--TD-bounce-phase3-color, var(--TD-bounce-phase1-color));
  }
  70% {
    background-color: var(--TD-bounce-phase3-color, var(--TD-bounce-phase1-color));
  }
  75% {
    background-color: var(--TD-bounce-phase4-color, var(--TD-bounce-phase1-color));
  }
  95% {
    background-color: var(--TD-bounce-phase4-color, var(--TD-bounce-phase1-color));
  }
}`);Array.from({length:4},(function(l,s){return"--TD-bounce-phase".concat(s+1,"-color")}));ye(`.blink-blur-rli-bounding-box {
  --shape-phase1-color: rgb(50, 205, 50);
  font-size: 16px;
  color: var(--shape-phase1-color);
}
.blink-blur-rli-bounding-box .blink-blur-indicator {
  isolation: isolate;
  display: flex;
  flex-direction: row;
  -moz-column-gap: 0.4em;
       column-gap: 0.4em;
}
.blink-blur-rli-bounding-box .blink-blur-indicator .blink-blur-shape {
  --x-deg: -20deg;
  width: 1.8em;
  height: 2.25em;
  border-radius: 0.25em;
  color: inherit;
  transform: skewX(var(--x-deg));
  background-color: var(--shape-phase1-color);
  animation-name: uxlv7id, uxlv7jl;
  animation-duration: var(--rli-animation-duration, 1.2s), calc(var(--rli-animation-duration, 1.2s) * 4);
  animation-timing-function: var(--rli-animation-function, ease-in);
  animation-iteration-count: infinite;
}
.blink-blur-rli-bounding-box .blink-blur-indicator .blink-blur-shape.blink-blur-shape1 {
  animation-delay: calc(var(--rli-animation-duration, 1.2s) * 0.5 * -1);
}
.blink-blur-rli-bounding-box .blink-blur-indicator .blink-blur-shape.blink-blur-shape2 {
  animation-delay: calc(var(--rli-animation-duration, 1.2s) * 0.4 * -1);
}
.blink-blur-rli-bounding-box .blink-blur-indicator .blink-blur-shape.blink-blur-shape3 {
  animation-delay: calc(var(--rli-animation-duration, 1.2s) * 0.3 * -1);
}
.blink-blur-rli-bounding-box .blink-blur-indicator .blink-blur-shape.blink-blur-shape4 {
  animation-delay: calc(var(--rli-animation-duration, 1.2s) * 0.2 * -1);
}
.blink-blur-rli-bounding-box .blink-blur-indicator .blink-blur-shape.blink-blur-shape5 {
  animation-delay: calc(var(--rli-animation-duration, 1.2s) * 0.1 * -1);
}

@property --shape-phase1-color {
  syntax: "<color>";
  inherits: true;
  initial-value: rgb(50, 205, 50);
}
@property --shape-phase2-color {
  syntax: "<color>";
  inherits: true;
  initial-value: rgb(50, 205, 50);
}
@property --shape-phase3-color {
  syntax: "<color>";
  inherits: true;
  initial-value: rgb(50, 205, 50);
}
@property --shape-phase4-color {
  syntax: "<color>";
  inherits: true;
  initial-value: rgb(50, 205, 50);
}
@property --rli-animation-duration {
  syntax: "<time>";
  inherits: true;
  initial-value: 1.2s;
}
@keyframes uxlv7id {
  100%, 0% {
    opacity: 0.3;
    filter: blur(0.0675em) drop-shadow(0 0 0.0625em);
    transform: skewX(var(--x-deg)) scale(1.2, 1.45);
  }
  39% {
    opacity: 0.8;
  }
  40%, 41%, 42% {
    opacity: 0;
  }
  43% {
    opacity: 0.8;
  }
  50% {
    opacity: 1;
    filter: blur(0em) drop-shadow(0 0 0em);
    transform: skewX(var(--x-deg)) scale(1, 1);
  }
}
@keyframes uxlv7jl {
  100%, 0% {
    color: var(--shape-phase1-color);
    background-color: var(--shape-phase1-color);
  }
  25% {
    color: var(--shape-phase2-color, var(--shape-phase1-color));
    background-color: var(--shape-phase2-color, var(--shape-phase1-color));
  }
  50% {
    color: var(--shape-phase3-color, var(--shape-phase1-color));
    background-color: var(--shape-phase3-color, var(--shape-phase1-color));
  }
  75% {
    color: var(--shape-phase4-color, var(--shape-phase1-color));
    background-color: var(--shape-phase4-color, var(--shape-phase1-color));
  }
}`);var Jo=Array.from({length:4},(function(l,s){return"--shape-phase".concat(s+1,"-color")})),nh=function(l){var s,a=Lp(l==null?void 0:l.style,l==null?void 0:l.size),c=a.styles,h=a.fontSize,v=l==null?void 0:l.easing,k=Ap(l==null?void 0:l.speedPlus,"1.2s").animationPeriod,w=(function(x){var _={},A=Jo.length;if(Array.isArray(x)&&x.length>0){for(var X=Ip(x,A),W=0;W<X.length&&!(W>A-1);W++){var J=X[W];_[Jo[W]]=J}return _}try{if(typeof x!="string")throw new Error("Color String expected");for(W=0;W<A;W++)_[Jo[W]]=x}catch(U){for(U instanceof Error?console.warn("[".concat(U.message,']: Received "').concat(typeof x,'" instead with value, ').concat(JSON.stringify(x))):console.warn("".concat(JSON.stringify(x)," received in <BlinkBlur /> indicator cannot be processed. Using default instead!")),W=0;W<A;W++)_[Jo[W]]=Uc}return _})((s=l==null?void 0:l.color)!==null&&s!==void 0?s:"");return Oe.createElement("span",{className:"rli-d-i-b blink-blur-rli-bounding-box",style:wn(wn(wn(wn(wn({},h&&{fontSize:h}),k&&{"--rli-animation-duration":k}),v&&{"--rli-animation-function":v}),w),c),role:"status","aria-live":"polite","aria-label":"Loading"},Oe.createElement("span",{className:"rli-d-i-b blink-blur-indicator"},Oe.createElement("span",{className:"blink-blur-shape blink-blur-shape1"}),Oe.createElement("span",{className:"blink-blur-shape blink-blur-shape2"}),Oe.createElement("span",{className:"blink-blur-shape blink-blur-shape3"}),Oe.createElement("span",{className:"blink-blur-shape blink-blur-shape4"}),Oe.createElement("span",{className:"blink-blur-shape blink-blur-shape5"})),Oe.createElement(Fp,{staticText:!0,text:l==null?void 0:l.text,textColor:l==null?void 0:l.textColor,style:{marginTop:"0.8em"}}))};ye(`.trophy-spin-rli-bounding-box {
  --trophySpin-phase1-color: rgb(50, 205, 50);
  box-sizing: border-box;
  font-size: 16px;
  position: relative;
  isolation: isolate;
  color: var(--trophySpin-phase1-color);
}
.trophy-spin-rli-bounding-box .trophy-spin-indicator {
  width: 4em;
  perspective: 1000px;
  transform-style: preserve-3d;
  display: block;
  margin: 0 auto;
}
.trophy-spin-rli-bounding-box .trophy-spin-indicator .blade {
  display: block;
  width: 4em;
  height: 0.5em;
  background: var(--trophySpin-phase1-color);
  animation: uxlv7ki var(--rli-animation-duration, 2.5s) var(--rli-animation-function, linear) infinite, uxlv7l2 calc(var(--rli-animation-duration, 2.5s) * 0.5) var(--rli-animation-function, linear) infinite, uxlv7ly calc(var(--rli-animation-duration, 2.5s) * 4) var(--rli-animation-function, linear) infinite;
}
.trophy-spin-rli-bounding-box .trophy-spin-indicator .blade:nth-of-type(8) {
  animation-delay: calc(var(--rli-animation-duration, 2.5s) / 2 / 8 * 0 * -1);
}
.trophy-spin-rli-bounding-box .trophy-spin-indicator .blade:nth-of-type(7) {
  animation-delay: calc(var(--rli-animation-duration, 2.5s) / 2 / 8 * 1 * -1);
}
.trophy-spin-rli-bounding-box .trophy-spin-indicator .blade:nth-of-type(6) {
  animation-delay: calc(var(--rli-animation-duration, 2.5s) / 2 / 8 * 2 * -1);
}
.trophy-spin-rli-bounding-box .trophy-spin-indicator .blade:nth-of-type(5) {
  animation-delay: calc(var(--rli-animation-duration, 2.5s) / 2 / 8 * 3 * -1);
}
.trophy-spin-rli-bounding-box .trophy-spin-indicator .blade:nth-of-type(4) {
  animation-delay: calc(var(--rli-animation-duration, 2.5s) / 2 / 8 * 4 * -1);
}
.trophy-spin-rli-bounding-box .trophy-spin-indicator .blade:nth-of-type(3) {
  animation-delay: calc(var(--rli-animation-duration, 2.5s) / 2 / 8 * 5 * -1);
}
.trophy-spin-rli-bounding-box .trophy-spin-indicator .blade:nth-of-type(2) {
  animation-delay: calc(var(--rli-animation-duration, 2.5s) / 2 / 8 * 6 * -1);
}
.trophy-spin-rli-bounding-box .trophy-spin-indicator .blade:nth-of-type(1) {
  animation-delay: calc(var(--rli-animation-duration, 2.5s) / 2 / 8 * 7 * -1);
}

@property --trophySpin-phase1-color {
  syntax: "<color>";
  inherits: true;
  initial-value: rgb(50, 205, 50);
}
@property --trophySpin-phase2-color {
  syntax: "<color>";
  inherits: true;
  initial-value: rgb(50, 205, 50);
}
@property --trophySpin-phase3-color {
  syntax: "<color>";
  inherits: true;
  initial-value: rgb(50, 205, 50);
}
@property --trophySpin-phase4-color {
  syntax: "<color>";
  inherits: true;
  initial-value: rgb(50, 205, 50);
}
@property --rli-animation-duration {
  syntax: "<time>";
  inherits: true;
  initial-value: 2.5s;
}
@keyframes uxlv7ki {
  to {
    transform: rotateY(1turn) rotateX(-25deg);
  }
}
@keyframes uxlv7l2 {
  100%, 0% {
    filter: brightness(1);
    opacity: 1;
  }
  15% {
    filter: brightness(1);
  }
  25% {
    opacity: 0.96;
  }
  30% {
    filter: brightness(0.92);
  }
  50% {
    filter: brightness(0.7);
    opacity: 1;
  }
  75% {
    filter: brightness(0.92);
    opacity: 0.96;
  }
  90% {
    filter: brightness(1);
  }
}
@keyframes uxlv7ly {
  100%, 0% {
    background-color: var(--trophySpin-phase1-color);
  }
  18% {
    background-color: var(--trophySpin-phase1-color);
  }
  25% {
    background-color: var(--trophySpin-phase2-color, var(--trophySpin-phase1-color));
  }
  43% {
    background-color: var(--trophySpin-phase2-color, var(--trophySpin-phase1-color));
  }
  50% {
    background-color: var(--trophySpin-phase3-color, var(--trophySpin-phase1-color));
  }
  68% {
    background-color: var(--trophySpin-phase3-color, var(--trophySpin-phase1-color));
  }
  75% {
    background-color: var(--trophySpin-phase4-color, var(--trophySpin-phase1-color));
  }
  93% {
    background-color: var(--trophySpin-phase4-color, var(--trophySpin-phase1-color));
  }
}`);Array.from({length:4},(function(l,s){return"--trophySpin-phase".concat(s+1,"-color")}));ye(`.slab-rli-bounding-box {
  --slab-phase1-color: rgb(50, 205, 50);
  font-size: 16px;
  color: var(--slab-phase1-color);
  position: relative;
}
.slab-rli-bounding-box .slab-indicator {
  position: relative;
  display: block;
  width: 7em;
  height: 4em;
  margin: 0 auto;
  overflow: hidden;
}
.slab-rli-bounding-box .slab-indicator .slabs-wrapper {
  width: 4em;
  height: 4em;
  transform: perspective(15em) rotateX(66deg) rotateZ(-25deg);
  transform-style: preserve-3d;
  transform-origin: 50% 100%;
  display: block;
  position: absolute;
  bottom: 0;
  right: 0;
}
.slab-rli-bounding-box .slab-indicator .slabs-wrapper .slab {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: var(--slab-phase1-color);
  opacity: 0;
  box-shadow: -0.08em 0.15em 0 rgba(0, 0, 0, 0.45);
  transform-origin: 0% 0%;
  animation: calc(var(--rli-animation-duration-unitless, 3) * 1s) var(--rli-animation-function, linear) infinite uxlv7md, calc(var(--rli-animation-duration-unitless, 3) * 4s) var(--rli-animation-function, linear) infinite uxlv7n0;
}
.slab-rli-bounding-box .slab-indicator .slabs-wrapper .slab:nth-child(1) {
  animation-delay: calc(4 / (16 / var(--rli-animation-duration-unitless, 3)) * 3 * -1 * 1s);
}
.slab-rli-bounding-box .slab-indicator .slabs-wrapper .slab:nth-child(2) {
  animation-delay: calc(4 / (16 / var(--rli-animation-duration-unitless, 3)) * 2 * -1 * 1s);
}
.slab-rli-bounding-box .slab-indicator .slabs-wrapper .slab:nth-child(3) {
  animation-delay: calc(4 / (16 / var(--rli-animation-duration-unitless, 3)) * -1 * 1s);
}
.slab-rli-bounding-box .slab-indicator .slabs-wrapper .slab:nth-child(4) {
  animation-delay: 0s;
}

@property --slab-phase1-color {
  syntax: "<color>";
  inherits: true;
  initial-value: rgb(50, 205, 50);
}
@property --slab-phase2-color {
  syntax: "<color>";
  inherits: true;
  initial-value: rgb(50, 205, 50);
}
@property --slab-phase3-color {
  syntax: "<color>";
  inherits: true;
  initial-value: rgb(50, 205, 50);
}
@property --slab-phase4-color {
  syntax: "<color>";
  inherits: true;
  initial-value: rgb(50, 205, 50);
}
@property --rli-animation-duration-unitless {
  syntax: "<number>";
  inherits: true;
  initial-value: 3;
}
@keyframes uxlv7md {
  0% {
    transform: translateY(0) rotateX(30deg);
    opacity: 0;
  }
  10% {
    transform: translateY(-40%) rotateX(0deg);
    opacity: 1;
  }
  25% {
    opacity: 1;
  }
  100% {
    transform: translateY(-400%) rotateX(0deg);
    opacity: 0;
  }
}
@keyframes uxlv7n0 {
  100%, 0% {
    background-color: var(--slab-phase1-color);
  }
  24.9% {
    background-color: var(--slab-phase1-color);
  }
  25% {
    background-color: var(--slab-phase2-color, var(--slab-phase1-color));
  }
  49.9% {
    background-color: var(--slab-phase2-color, var(--slab-phase1-color));
  }
  50% {
    background-color: var(--slab-phase3-color, var(--slab-phase1-color));
  }
  74.9% {
    background-color: var(--slab-phase3-color, var(--slab-phase1-color));
  }
  75% {
    background-color: var(--slab-phase4-color, var(--slab-phase1-color));
  }
  99.9% {
    background-color: var(--slab-phase4-color, var(--slab-phase1-color));
  }
}`);Array.from({length:4},(function(l,s){return"--slab-phase".concat(s+1,"-color")}));ye(`.lifeline-rli-bounding-box {
  --life-line-phase1-color: rgb(50, 205, 50);
  font-size: 16px;
  isolation: isolate;
  color: var(--life-line-phase1-color);
}
.lifeline-rli-bounding-box .lifeline-indicator {
  position: relative;
  text-align: center;
}
.lifeline-rli-bounding-box .lifeline-indicator path.rli-lifeline {
  stroke-dasharray: 474.7616760254 30.3039367676;
  animation: var(--rli-animation-duration, 2s) var(--rli-animation-function, linear) infinite uxlv7k3, calc(var(--rli-animation-duration, 2s) * 4) var(--rli-animation-function, linear) infinite uxlv7kg;
}
.lifeline-rli-bounding-box .lifeline-text {
  color: currentColor;
  mix-blend-mode: difference;
  width: unset;
  display: block;
}

@property --life-line-phase1-color {
  syntax: "<color>";
  inherits: true;
  initial-value: rgb(50, 205, 50);
}
@property --life-line-phase2-color {
  syntax: "<color>";
  inherits: true;
  initial-value: rgb(50, 205, 50);
}
@property --life-line-phase3-color {
  syntax: "<color>";
  inherits: true;
  initial-value: rgb(50, 205, 50);
}
@property --life-line-phase4-color {
  syntax: "<color>";
  inherits: true;
  initial-value: rgb(50, 205, 50);
}
@property --rli-animation-duration {
  syntax: "<time>";
  inherits: true;
  initial-value: 2s;
}
@keyframes uxlv7k3 {
  to {
    stroke-dashoffset: -1010.1312255859;
  }
}
@keyframes uxlv7kg {
  100%, 0% {
    color: var(--life-line-phase1-color);
  }
  20% {
    color: var(--life-line-phase1-color);
  }
  25% {
    color: var(--life-line-phase2-color, var(--life-line-phase1-color));
  }
  45% {
    color: var(--life-line-phase2-color, var(--life-line-phase1-color));
  }
  50% {
    color: var(--life-line-phase3-color, var(--life-line-phase1-color));
  }
  70% {
    color: var(--life-line-phase3-color, var(--life-line-phase1-color));
  }
  75% {
    color: var(--life-line-phase4-color, var(--life-line-phase1-color));
  }
  95% {
    color: var(--life-line-phase4-color, var(--life-line-phase1-color));
  }
}`);Array.from({length:4},(function(l,s){return"--life-line-phase".concat(s+1,"-color")}));function Hp({title:l,titleId:s,...a},c){return B.createElement("svg",Object.assign({xmlns:"http://www.w3.org/2000/svg",viewBox:"0 0 24 24",fill:"currentColor","aria-hidden":"true","data-slot":"icon",ref:c,"aria-labelledby":s},a),l?B.createElement("title",{id:s},l):null,B.createElement("path",{fillRule:"evenodd",d:"M14.615 1.595a.75.75 0 0 1 .359.852L12.982 9.75h7.268a.75.75 0 0 1 .548 1.262l-10.5 11.25a.75.75 0 0 1-1.272-.71l1.992-7.302H3.75a.75.75 0 0 1-.548-1.262l10.5-11.25a.75.75 0 0 1 .913-.143Z",clipRule:"evenodd"}))}const th=B.forwardRef(Hp);function Up({title:l,titleId:s,...a},c){return B.createElement("svg",Object.assign({xmlns:"http://www.w3.org/2000/svg",viewBox:"0 0 24 24",fill:"currentColor","aria-hidden":"true","data-slot":"icon",ref:c,"aria-labelledby":s},a),l?B.createElement("title",{id:s},l):null,B.createElement("path",{fillRule:"evenodd",d:"M2.25 12c0-5.385 4.365-9.75 9.75-9.75s9.75 4.365 9.75 9.75-4.365 9.75-9.75 9.75S2.25 17.385 2.25 12Zm13.36-1.814a.75.75 0 1 0-1.22-.872l-3.236 4.53L9.53 12.22a.75.75 0 0 0-1.06 1.06l2.25 2.25a.75.75 0 0 0 1.14-.094l3.75-5.25Z",clipRule:"evenodd"}))}const rh=B.forwardRef(Up);function $p({title:l,titleId:s,...a},c){return B.createElement("svg",Object.assign({xmlns:"http://www.w3.org/2000/svg",viewBox:"0 0 24 24",fill:"currentColor","aria-hidden":"true","data-slot":"icon",ref:c,"aria-labelledby":s},a),l?B.createElement("title",{id:s},l):null,B.createElement("path",{fillRule:"evenodd",d:"M12.516 2.17a.75.75 0 0 0-1.032 0 11.209 11.209 0 0 1-7.877 3.08.75.75 0 0 0-.722.515A12.74 12.74 0 0 0 2.25 9.75c0 5.942 4.064 10.933 9.563 12.348a.749.749 0 0 0 .374 0c5.499-1.415 9.563-6.406 9.563-12.348 0-1.39-.223-2.73-.635-3.985a.75.75 0 0 0-.722-.516l-.143.001c-2.996 0-5.717-1.17-7.734-3.08Zm3.094 8.016a.75.75 0 1 0-1.22-.872l-3.236 4.53L9.53 12.22a.75.75 0 0 0-1.06 1.06l2.25 2.25a.75.75 0 0 0 1.14-.094l3.75-5.25Z",clipRule:"evenodd"}))}const oh=B.forwardRef($p);function Bp({title:l,titleId:s,...a},c){return B.createElement("svg",Object.assign({xmlns:"http://www.w3.org/2000/svg",viewBox:"0 0 24 24",fill:"currentColor","aria-hidden":"true","data-slot":"icon",ref:c,"aria-labelledby":s},a),l?B.createElement("title",{id:s},l):null,B.createElement("path",{fillRule:"evenodd",d:"M9 4.5a.75.75 0 0 1 .721.544l.813 2.846a3.75 3.75 0 0 0 2.576 2.576l2.846.813a.75.75 0 0 1 0 1.442l-2.846.813a3.75 3.75 0 0 0-2.576 2.576l-.813 2.846a.75.75 0 0 1-1.442 0l-.813-2.846a3.75 3.75 0 0 0-2.576-2.576l-2.846-.813a.75.75 0 0 1 0-1.442l2.846-.813A3.75 3.75 0 0 0 7.466 7.89l.813-2.846A.75.75 0 0 1 9 4.5ZM18 1.5a.75.75 0 0 1 .728.568l.258 1.036c.236.94.97 1.674 1.91 1.91l1.036.258a.75.75 0 0 1 0 1.456l-1.036.258c-.94.236-1.674.97-1.91 1.91l-.258 1.036a.75.75 0 0 1-1.456 0l-.258-1.036a2.625 2.625 0 0 0-1.91-1.91l-1.036-.258a.75.75 0 0 1 0-1.456l1.036-.258a2.625 2.625 0 0 0 1.91-1.91l.258-1.036A.75.75 0 0 1 18 1.5ZM16.5 15a.75.75 0 0 1 .712.513l.394 1.183c.15.447.5.799.948.948l1.183.395a.75.75 0 0 1 0 1.422l-1.183.395c-.447.15-.799.5-.948.948l-.395 1.183a.75.75 0 0 1-1.422 0l-.395-1.183a1.5 1.5 0 0 0-.948-.948l-1.183-.395a.75.75 0 0 1 0-1.422l1.183-.395c.447-.15.799-.5.948-.948l.395-1.183A.75.75 0 0 1 16.5 15Z",clipRule:"evenodd"}))}const ih=B.forwardRef(Bp);function Vp({title:l,titleId:s,...a},c){return B.createElement("svg",Object.assign({xmlns:"http://www.w3.org/2000/svg",viewBox:"0 0 24 24",fill:"currentColor","aria-hidden":"true","data-slot":"icon",ref:c,"aria-labelledby":s},a),l?B.createElement("title",{id:s},l):null,B.createElement("path",{fillRule:"evenodd",d:"M10.788 3.21c.448-1.077 1.976-1.077 2.424 0l2.082 5.006 5.404.434c1.164.093 1.636 1.545.749 2.305l-4.117 3.527 1.257 5.273c.271 1.136-.964 2.033-1.96 1.425L12 18.354 7.373 21.18c-.996.608-2.231-.29-1.96-1.425l1.257-5.273-4.117-3.527c-.887-.76-.415-2.212.749-2.305l5.404-.434 2.082-5.005Z",clipRule:"evenodd"}))}const lh=B.forwardRef(Vp),ah={classId:"classID",dataType:"datatype",itemId:"itemID",strokeDashArray:"strokeDasharray",strokeDashOffset:"strokeDashoffset",strokeLineCap:"strokeLinecap",strokeLineJoin:"strokeLinejoin",strokeMiterLimit:"strokeMiterlimit",typeOf:"typeof",xLinkActuate:"xlinkActuate",xLinkArcRole:"xlinkArcrole",xLinkHref:"xlinkHref",xLinkRole:"xlinkRole",xLinkShow:"xlinkShow",xLinkTitle:"xlinkTitle",xLinkType:"xlinkType",xmlnsXLink:"xmlnsXlink"};function Wp({title:l,titleId:s,...a},c){return B.createElement("svg",Object.assign({xmlns:"http://www.w3.org/2000/svg",fill:"none",viewBox:"0 0 24 24",strokeWidth:1.5,stroke:"currentColor","aria-hidden":"true","data-slot":"icon",ref:c,"aria-labelledby":s},a),l?B.createElement("title",{id:s},l):null,B.createElement("path",{strokeLinecap:"round",strokeLinejoin:"round",d:"M6 18 18 6M6 6l12 12"}))}const uh=B.forwardRef(Wp);var $c=Dc();const Qp=ti($c),sh=zc({__proto__:null,default:Qp},[$c]);export{th as F,eh as H,Oe as R,rh as a,lh as b,oh as c,uh as d,Gp as e,sh as f,ti as g,ah as h,Yp as i,Zp as j,ih as k,Jp as l,hp as m,B as r,Fc as u,nh as z};
