docker : pg_dump: error: connection to server at "aws-0-us-west-1.pooler.supabase.com" 
(52.8.172.168), port 5432 failed: FATAL:  Tenant or user not found
At line:1 char:1
+ docker run --rm postgres:15 pg_dump "postgresql://postgres:biLNCCJgKs ...
+ ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
    + CategoryInfo          : NotSpecified: (pg_dump: error:... user not found:String) [], RemoteE 
   xception
    + FullyQualifiedErrorId : NativeCommandError
 
