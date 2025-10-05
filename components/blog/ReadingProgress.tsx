import React from "react";

export function ReadingProgress() {
  return (
    <div className="fixed top-0 left-0 right-0 z-50 h-[3px] bg-transparent">
      <div id="progressBar" className="h-full bg-primary origin-left scale-x-0" />
      {/* eslint-disable-next-line @next/next/no-sync-scripts */}
      <script dangerouslySetInnerHTML={{ __html: `(
        function(){
          var p=document.getElementById('progressBar');
          function u(){
            var h=document.documentElement;var s=h.scrollTop||document.body.scrollTop;var m=h.scrollHeight-h.clientHeight;var r=m? s/m:0;p.style.transform='scaleX('+r+')';
          }
          window.addEventListener('scroll',u,{passive:true});u();
        })();
      `}} />
    </div>
  );
}


