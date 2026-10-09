import path from 'node:path';
export default {outputFileTracingRoot:path.resolve('.'),poweredByHeader:false,async headers(){return [{source:'/(.*)',headers:[{key:'X-Content-Type-Options',value:'nosniff'},{key:'Referrer-Policy',value:'same-origin'},{key:'X-Frame-Options',value:'DENY'}]}]}};
