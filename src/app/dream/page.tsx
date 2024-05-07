"use client";
import { CardContent, Card } from "@/components/ui/card";
import { useEffect, useState } from "react";
import { getRooms } from "../lib/function";
import { UserIcon } from "@/components/icon";
import Link from "next/link";

export default function Component() {
  const [rooms, setRooms] = useState<any>([]);
  useEffect(() => {
    getAvailableRooms();
  }, []);

  const getAvailableRooms = async () => {
    const roomResponse = await getRooms();
    console.log(roomResponse);
    const parsedRoomResponse = await JSON.parse(roomResponse);
    if (parsedRoomResponse.status !== 200) {
      return alert("Failed to fetch rooms");
    }
    setRooms(parsedRoomResponse.data);
  };

  return (
    <div className="w-full max-w-6xl mx-auto py-12 px-4 sm:px-6 lg:px-8">
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-3xl font-bold">Join a Meeting</h1>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
        {rooms.map((room: any) => (
          <Link
            href={`/dream/room/${room.classroom_id}`}
            key={room.classroom_id}
          >
            <Card>
              <CardContent className="p-6 hover:shadow-md">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-xl font-bold">{room.classroom_name}</h2>
                </div>
                <p className="text-gray-500 mb-4">
                  {room.classroom_description}
                </p>
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <UserIcon className="text-gray-400" />
                    <span className="text-gray-500">{room.instructor}</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>
      <footer className="w-full py-4 flex justify-center items-center">
        <p className="text-gray-500 dark:text-gray-400">
          Powered by Catalyst, Built for Dream Kit
        </p>
      </footer>
    </div>
  );
}
