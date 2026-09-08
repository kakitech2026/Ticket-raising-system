"use client";
import { useRef,useState } from "react";
export function ImageGallery({images,imageClassName="w-full h-32 object-cover",containerClassName="grid grid-cols-2 md:grid-cols-3 gap-3"}:{images:{id:string;url:string}[];imageClassName?:string;containerClassName?:string}){
  const dialog=useRef<HTMLDialogElement>(null),[selected,setSelected]=useState<string|null>(null);
  return <><div className={containerClassName}>{images.map((image,index)=><button aria-label={"Expand screenshot "+(index+1)} key={image.id} onClick={()=>{setSelected(image.url);dialog.current?.showModal();}}><img src={image.url} alt={"Screenshot "+(index+1)} loading="lazy" className={imageClassName}/></button>)}</div>
    <dialog ref={dialog} aria-label="Screenshot viewer" className="m-auto w-[90vw] max-w-5xl max-h-[90vh] bg-neutral-900 text-neutral-100 p-4 rounded-xl backdrop:bg-black/80"><div className="flex justify-end gap-4 mb-3">{selected&&<a href={selected} download="screenshot">Download</a>}<button autoFocus onClick={()=>dialog.current?.close()}>Close</button></div>{selected&&<img src={selected} alt="Expanded screenshot" className="max-h-[75vh] mx-auto object-contain"/>}</dialog>
  </>;
}