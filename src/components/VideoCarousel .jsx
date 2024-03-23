import gsap from "gsap";
import { useGSAP } from "@gsap/react";
import { ScrollTrigger } from "gsap/all";
gsap.registerPlugin(ScrollTrigger);
import { useEffect, useRef, useState } from "react";

import { hightlightsSlides } from "../constants";
import { pauseImg, playImg, replayImg } from "../utils";

const VideoCarousel = () => {
    // useRefを使ってvideoRef、videoSpanRef、videoDivRefの初期値を空の配列に設定
    const videoRef = useRef([]);
    const videoSpanRef = useRef([]);
    const videoDivRef = useRef([]);
   
    // ビデオとプログレスバーの状態を管理するための状態変数
    const [video, setVideo] = useState({
      isEnd: false, // ビデオが終了したかどうかを示すフラグ
      startPlay: false, // ビデオの再生が開始されたかどうかを示すフラグ
      videoId: 0, // 現在のビデオのインデックス
      isLastVideo: false, // 最後のビデオかどうかを示すフラグ
      isPlaying: false, // ビデオが再生中かどうかを示すフラグ
    });
   
    // ロード済みのメタデータを格納する状態変数
    const [loadedData, setLoadedData] = useState([]);
   
    // videoの状態を分割代入
    const { isEnd, isLastVideo, startPlay, videoId, isPlaying } = video;
   
    useGSAP(() => {
      // ビデオをスクリーンの外に移動し、次のビデオを画面に入れるためのスライダーアニメーション
      gsap.to("#slider", {
        transform: `translateX(${-100 * videoId}%)`, // -100%ずつ移動
        duration: 2, // 2秒かけて移動
        ease: "power2.inOut", // 移動のイージングを指定
      });
   
      // ビデオがビューに入ったときにビデオを再生するためのビデオアニメーション
      gsap.to("#video", {
        scrollTrigger: {
          trigger: "#video", // #videoがスクロールトリガーの対象
          toggleActions: "restart none none none", // トリガーが発火したときの動作を指定
        },
        onComplete: () => {
          // アニメーション完了時にstartPlayとisPlayingをtrueに設定
          setVideo((pre) => ({
            ...pre,
            startPlay: true,
            isPlaying: true,
          }));
        },
      });
    }, [isEnd, videoId]); // isEndとvideoIdが変更された場合に再実行
   
    useEffect(() => {
      let currentProgress = 0; // 現在の進行状況を格納する変数
      let span = videoSpanRef.current; // videoSpanRefの現在の値を取得
   
      if (span[videoId]) {
        // 指標を移動するためのアニメーション
        let anim = gsap.to(span[videoId], {
          onUpdate: () => {
            // ビデオの進行状況を取得
            const progress = Math.ceil(anim.progress() * 100); // 進行状況を0～100の整数値に変換
   
            if (progress !== currentProgress) {
              currentProgress = progress; // 現在の進行状況を更新
   
              // プログレスバーの幅を設定
              gsap.to(videoDivRef.current[videoId], {
                width:
                  window.innerWidth < 760
                    ? "10vw" // モバイル：10vw
                    : window.innerWidth < 1200
                    ? "10vw" // タブレット：10vw
                    : "4vw", // ラップトップ：4vw
              });
   
              // プログレスバーの背景色を設定
              gsap.to(span[videoId], {
                width: `${currentProgress}%`, // 進行状況に応じた幅
                backgroundColor: "white", // 背景色を白に設定
              });
            }
          },
   
          // ビデオが終了したら、プログレスバーを指標に置き換え、背景色を変更
          onComplete: () => {
            if (isPlaying) {
              gsap.to(videoDivRef.current[videoId], {
                width: "12px", // 幅を12pxに設定
              });
              gsap.to(span[videoId], {
                backgroundColor: "#afafaf", // 背景色を灰色に設定
              });
            }
          },
        });
   
        if (videoId === 0) {
          anim.restart(); // videoIdが0の場合はアニメーションをリスタート
        }
   
        // プログレスバーを更新
        const animUpdate = () => {
          anim.progress(
            videoRef.current[videoId].currentTime /
              hightlightsSlides[videoId].videoDuration
          );
        };
   
        if (isPlaying) {
          // プログレスバーを更新するためのティッカーを追加
          gsap.ticker.add(animUpdate);
        } else {
          // ビデオが一時停止されたときにティッカーを削除（プログレスバーが停止）
          gsap.ticker.remove(animUpdate);
        }
      }
    }, [videoId, startPlay]); // videoIdとstartPlayが変更された場合に再実行
   
    useEffect(() => {
      if (loadedData.length > 3) {
        if (!isPlaying) {
          videoRef.current[videoId].pause(); // ビデオを一時停止
        } else {
          startPlay && videoRef.current[videoId].play(); // ビデオを再生
        }
      }
    }, [startPlay, videoId, isPlaying, loadedData]); // 依存する状態が変更された場合に再実行
   
    // vd idは各ビデオのidで、idが3になるまで増加します
    const handleProcess = (type, i) => {
      switch (type) {
        case "video-end":
          // ビデオが終了したときの処理
          setVideo((pre) => ({ ...pre, isEnd: true, videoId: i + 1 }));
          break;
   
        case "video-last":
          // 最後のビデオの場合の処理
          setVideo((pre) => ({ ...pre, isLastVideo: true }));
          handleProcess("video-reset");
          handleProcess("play");
          break;
   
        case "video-reset":
          // ビデオをリセットする場合の処理
          setVideo((pre) => ({ ...pre, videoId: 0, isLastVideo: false }));
          break;
   
        case "pause":
          // ビデオを一時停止する場合の処理
          setVideo((pre) => ({ ...pre, isPlaying: !pre.isPlaying }));
          break;
   
        case "play":
          // ビデオを再生する場合の処理
          setVideo((pre) => ({ ...pre, isPlaying: !pre.isPlaying }));
          break;
   
        default:
          return video;
      }
    };
   
    // メタデータがロードされた場合の処理
    const handleLoadedMetaData = (i, e) => setLoadedData((pre) => [...pre, e]);
   
    return (
      <>
        <div className="flex items-center">
          {hightlightsSlides.map((list, i) => (
            <div key={list.id} id="slider" className="sm:pr-20 pr-10">
              <div className="video-carousel_container">
                <div className="w-full h-full flex-center rounded-3xl overflow-hidden bg-black">
                  <video
                    id="video"
                    playsInline={true}
                    className={`${
                      list.id === 2 && "translate-x-44"
                    } pointer-events-none`}
                    preload="auto"
                    muted
                    ref={(el) => (videoRef.current[i] = el)}
                    onEnded={() =>
                      i !== 3
                        ? handleProcess("video-end", i)
                        : handleProcess("video-last")
                    }
                    onPlay={() =>
                      setVideo((pre) => ({ ...pre, isPlaying: true }))
                    }
                    onLoadedMetadata={(e) => handleLoadedMetaData(i, e)}
                  >
                    <source src={list.video} type="video/mp4" />
                  </video>
                </div>
   
                <div className="absolute top-12 left-[5%] z-10">
                  {list.textLists.map((text, i) => (
                    <p key={i} className="md:text-2xl text-xl font-medium">
                      {text}
                    </p>
                  ))}
                </div>
              </div>
            </div>
          ))}
        </div>
   
        <div className="relative flex-center mt-10">
          <div className="flex-center py-5 px-7 bg-gray-300 backdrop-blur rounded-full">
            {videoRef.current.map((_, i) => (
              <span
                key={i}
                className="mx-2 w-3 h-3 bg-gray-200 rounded-full relative cursor-pointer"
                ref={(el) => (videoDivRef.current[i] = el)}
              >
                <span
                  className="absolute h-full w-full rounded-full"
                  ref={(el) => (videoSpanRef.current[i] = el)}
                />
              </span>
            ))}
          </div>
   
          <button className="control-btn">
            <img
              src={isLastVideo ? replayImg : !isPlaying ? playImg : pauseImg}
              alt={isLastVideo ? "replay" : !isPlaying ? "play" : "pause"}
              onClick={
                isLastVideo
                  ? () => handleProcess("video-reset")
                  : !isPlaying
                  ? () => handleProcess("play")
                  : () => handleProcess("pause")
              }
            />
          </button>
        </div>
      </>
    );
   };
   
   export default VideoCarousel;