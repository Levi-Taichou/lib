import {sleep,publish,subscribe,MonitorDomid,MonitorVisible,SelectTabBasedOnName,DomList,SelectTabBasedOnNumber,LinkClickButton} from '../lib/koios_util.mjs';
import {SelectNextLesson,CurrentCourseTitle}  from './koios_lessons.mjs';

var oldtarget;
var oldbackgroundColor;
var oldfontSize;


function GetAllTabs(areaid) {

    var domid=document.getElementById(areaid);
    var slides=domid.getElementsByClassName("w-slide");
    
    var IndexBlockList = new DomList("index-block")  
    
    for (var i=0;i<slides.length;i++) {

        var tabinfo=GetTabHeading(domid,i);
        if (tabinfo.name.toLowerCase() != "index") { // don't show the index in the index
        //     console.log(tabinfo)        
                var target = IndexBlockList.AddListItem() 
                CreateBlock(target,i,tabinfo.name,tabinfo.icon);
        }
        //   console.log("copy icon to bottom");
        var childdomid=domid.getElementsByClassName("w-slider-dot")[i]
        //console.log(childdomid);
        childdomid.innerHTML=tabinfo.icon;
        childdomid.style.fontFamily=tabinfo.fam;        
        childdomid.style.backgroundColor="transparent"   // hide circle
    }
    
    
    function CreateBlock(domid,id,name,icon) { // seperate function to remember state for click
        //target.getElementsByTagName("h2")[0].innerHTML = name;
        
        target.getElementsByClassName("tab-name")[0].innerHTML = name;        
        target.getElementsByClassName("large-icon")[0].innerHTML = icon;        
        domid.addEventListener("click",  x=>SelectTabBasedOnNumber(areaid,id));
     }

}    


function GetTabHeading(domid,childnr) {
    var tabheadings=domid.getElementsByClassName("tab-heading");
    var target2=tabheadings[childnr];
    var name=target2.getElementsByTagName("h2")[0].innerHTML;
    var icon=target2.getElementsByClassName("large-icon")[0];    
    
    var fam=window.getComputedStyle(icon).getPropertyValue("font-family")
    var size=window.getComputedStyle(icon).getPropertyValue("font-size")        
    
    
    return {name:name, icon:icon.innerHTML, fam:fam, size:size}
}      

function ChildChanged(childdomid,childnr) {
    console.log(`In function ChildChanged ${childnr}`);
    if (childdomid !== oldtarget) {
        if (oldtarget) {
           // oldtarget.style.backgroundColor = oldbackgroundColor;
           // oldtarget.innerHTML=""
            oldtarget.style.fontSize=oldfontSize;
        }
        oldbackgroundColor = childdomid.style.backgroundColor;
        oldfontSize = childdomid.style.fontSize;
        
        var domid=document.getElementById("popup");        
        var tabinfo=GetTabHeading(domid,childnr)        
        childdomid.id=tabinfo.name.toLowerCase().trim();
        childdomid.innerHTML=tabinfo.icon;
        childdomid.style.fontFamily=tabinfo.fam;
        childdomid.style.fontSize=tabinfo.size;
        childdomid.style.backgroundColor="transparent"   // hide circle
        oldtarget=childdomid;
    }
}    


 subscribe("loadvideo",VideoLoaded)
 
function VideoLoaded(vidinfo) {
    var domid=document.getElementById("popupvideoname");
    domid.innerHTML=`${CurrentCourseTitle} / ${vidinfo.txt}`
    domid.style.overflow="hidden"
    domid.style.textOverflow="ellipsis"  
    domid.style.whiteSpace="nowrap"

}    
 

function NextCourseClick() {
    
    SelectTabBasedOnName("popup","courses-overview") // class of the tab
}  


export function InitPopup() { 
    Webflow.require('slider').redraw(); // create to dots
    
    MonitorDomid("popup","w-slider-nav","w-slider-dot","w-active",ChildChanged)    
    MonitorVisible("popup") // publishes when object changes vibility
    GetAllTabs("popup")
    
    LinkClickButton("next_video",false);subscribe("next_videoclick",x=>SelectNextLesson(+1));
    LinkClickButton("prev_video",false);subscribe("prev_videoclick",x=>SelectNextLesson(-1));
         
    LinkClickButton("next_course",false);subscribe("next_courseclick",NextCourseClick);
    
    
    
}    

// Later, you can stop observing
// observer.disconnect();


/*
    margin: 20px;
    margin-top: 20px;
    margin-right: 20px;
    margin-bottom: 20px;
    margin-left: 20px;
*/



subscribe('popupdisplayblock',x=> {
      window.dispatchEvent(new Event('resize')); // resize window to make sure the slide scroll is calibrated again 
});   





export async function SelectPopup(name) {
    console.log(`SelectPopup ${name}`);
    publish (`start${name}`);
    OpenPopup(true)
    SelectTabBasedOnName("popup",name);  
    publish (`stop${name}`);
}


   
export async function OpenPopup(fOpen) {
    var style = window.getComputedStyle(document.getElementById("popup"))
    
    var fCurrentlyOpen = !style.display.includes("none")
    
    if ((fCurrentlyOpen && !fOpen) || (!fCurrentlyOpen && fOpen)) {
        document.getElementById('bottle').click();        
        await sleep(1000);
    }
    console.log(document.getElementById("popup").style.cssText);
}

   
   
   
