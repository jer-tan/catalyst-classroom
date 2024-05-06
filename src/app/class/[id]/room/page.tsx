"use client";
import React, { useEffect, useState } from "react";
import { VideoSDKMeeting } from "@videosdk.live/rtc-js-prebuilt";
import { joinRoom } from "@/app/lib/function";
import { useRouter } from "next/navigation";
import { hasCookie } from "cookies-next";

export default function Room({ params }: { params: { id: string } }) {
  const [initMeeting, setInitMeeting] = useState<(() => void) | null>(null);
  const router = useRouter();

  useEffect(() => {
    if (!hasCookie("jwt")) {
      router.push("/auth/login");
    }

    const initializeMeeting = async (
      user_name: string,
      classroom_name: string,
      instructor: boolean,
      token: string
    ) => {
      const meetingId = params.id;
      const name = user_name;
      const config = {
        name: name,
        meetingId: meetingId,
        // apiKey: apiKey,
        token: token,

        region: "sg001", // region for new meeting

        containerId: null,
        redirectOnLeave: "https://catalyst.jerometanofficial.com/class/",

        micEnabled: true,
        webcamEnabled: true,
        participantCanToggleSelfWebcam: true,
        participantCanToggleSelfMic: true,
        participantCanLeave: true, // if false, leave button won't be visible

        chatEnabled: true,
        screenShareEnabled: true,
        pollEnabled: true,
        whiteboardEnabled: true,
        raiseHandEnabled: true,

        recording: {
          autoStart: true, // auto start recording on participant joined
          enabled: true,
          webhookUrl: "https://www.videosdk.live/callback",
          awsDirPath: `/meeting-recordings/${meetingId}/`, // automatically save recording in this s3 path
        },

        livestream: {
          autoStart: false,
          enabled: false,
        },

        layout: {
          type: "SPOTLIGHT", // "SPOTLIGHT" | "SIDEBAR" | "GRID"
          priority: "PIN", // "SPEAKER" | "PIN",
          // gridSize: 3,
        },

        branding: {
          enabled: false,
          logoUrl: "XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX",
          name: classroom_name,
          poweredBy: false,
        },

        permissions: {
          pin: true,
          askToJoin: false, // Ask joined participants for entry in meeting
          toggleParticipantMic: instructor, // Can toggle other participant's mic
          toggleParticipantWebcam: instructor, // Can toggle other participant's webcam
          drawOnWhiteboard: true, // Can draw on whiteboard
          toggleWhiteboard: true, // Can toggle whiteboard
          toggleRecording: true, // Can toggle meeting recording
          toggleLivestream: false, //can toggle live stream
          removeParticipant: instructor, // Can remove participant
          endMeeting: instructor, // Can end meeting
          changeLayout: true, //can change layout
          canCreatePoll: instructor, // Can create a poll
        },

        joinScreen: {
          visible: true, // Show the join screen ?
          title: classroom_name, // Meeting title
          meetingUrl: window.location.href, // Meeting joining url
        },

        leftScreen: {
          // visible when redirect on leave not provided
          actionButton: {
            // optional action button
            label: "View Classrooms", // action button label
            href: "http://localhost:3000/class/", // action button href
          },
        },

        notificationSoundEnabled: true,

        debug: false, // pop up error during invalid config or network error

        maxResolution: "hd", // "hd" or "sd"

        // For more features check: /prebuilt/guide/prebuilt-video-and-audio-calling/getting-started
      };

      const meeting = new VideoSDKMeeting();

      meeting.init(config as any);
    };

    const loadRoomInfo = async () => {
      const roomInfo = await joinRoom(params.id);
      const parsedRoomInfo = await JSON.parse(roomInfo);
      console.log(roomInfo);
      return parsedRoomInfo;
    };
    loadRoomInfo()
      .then((data) => {
        console.log(data);
        initializeMeeting(
          data.user_name,
          data.data.classroom_name,
          data.instructor,
          data.token
        );
      })
      .catch((error) => {
        console.log(error);
      });
  }, [params.id]);

  return <div></div>;
}
