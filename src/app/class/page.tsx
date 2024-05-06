/**
 * v0 by Vercel.
 * @see https://v0.dev/t/GkNjwEC
 * Documentation: https://v0.dev/docs#integrating-generated-code-into-your-nextjs-app
 */
"use client";
import { Button } from "@/components/ui/button";
import { CardContent, Card } from "@/components/ui/card";
import Link from "next/link";
import { useEffect, useState } from "react";
import {
  HomeIcon,
  BookIcon,
  FileEditIcon,
  MessageSquareIcon,
  UserIcon,
  RocketIcon,
} from "@/components/icon";
import { getClassrooms } from "../lib/function";
import { hasCookie } from "cookies-next";
import { useRouter } from "next/navigation";

export default function Component() {
  const [isOpen, setIsOpen] = useState(false);
  const router = useRouter();

  const [classrooms, setClassrooms] = useState<any>([]);
  useEffect(() => {
    if (!hasCookie("jwt")) {
      router.push("/auth/login");
    }

    const fetchData = async () => {
      const classes = await getClassrooms();
      const parsedClasses = JSON.parse(classes as string);
      if (!parsedClasses.status) {
        setClassrooms(parsedClasses);
      }
      console.log(parsedClasses);
    };

    fetchData();
  }, []);
  return (
    <div className="flex flex-col md:flex-row h-screen">
      <div>
        <header className="bg-gray-100 text-gray-800 p-4 flex justify-between">
          <Link href="/dashboard">
            <div className="flex items-center space-x-2">
              <RocketIcon className=" text-gray-900 dark:text-gray-50" />
              <h1 className="text-lg font-medium">Catalyst</h1>
            </div>
          </Link>
          <div className="align-middle">
            <button
              className="block md:hidden align-right"
              onClick={() => setIsOpen(!isOpen)}
              aria-label="Open Mobile Menu"
            >
              <svg
                className="h-6 w-6"
                viewBox="0 0 24 24"
                version="1.1"
                xmlns="http://www.w3.org/2000/svg"
              >
                <title>Menu</title>
                <g
                  id="Page-1"
                  stroke="none"
                  strokeWidth="1"
                  fill="none"
                  fillRule="evenodd"
                >
                  <g id="Menu">
                    <rect
                      id="Rectangle"
                      fillRule="nonzero"
                      x="0"
                      y="0"
                      width="24"
                      height="24"
                    ></rect>
                    <line
                      x1="5"
                      y1="7"
                      x2="19"
                      y2="7"
                      id="Path"
                      stroke="#0C0310"
                      strokeWidth="2"
                      strokeLinecap="round"
                    ></line>
                    <line
                      x1="5"
                      y1="17"
                      x2="19"
                      y2="17"
                      id="Path"
                      stroke="#0C0310"
                      strokeWidth="2"
                      strokeLinecap="round"
                    ></line>
                    <line
                      x1="5"
                      y1="12"
                      x2="19"
                      y2="12"
                      id="Path"
                      stroke="#0C0310"
                      strokeWidth="2"
                      strokeLinecap="round"
                    ></line>
                  </g>
                </g>
              </svg>
            </button>
          </div>
        </header>
        <nav
          className={`md:flex md:flex-col md:min-h-screen md:w-56 bg-gray-100 text-gray-800 p-4 ${
            isOpen ? "block" : "hidden"
          }`}
        >
          <Link href="/dashboard">
            <button className="w-full flex items-center space-x-2 hover:bg-gray-200 active:bg-gray-300 py-2 px-2 rounded-lg text-gray-500">
              <HomeIcon className="w-4 h-4" />
              <span className="text-sm font-medium">Dashboard</span>
            </button>
          </Link>
          <Link href="/class">
            <button className="w-full flex items-center space-x-2 mt-2 bg-gray-200 active:bg-gray-300 py-2 px-2 rounded-lg text-gray-800">
              <BookIcon className="w-4 h-4" />
              <span className="text-sm font-medium">Class</span>
            </button>
          </Link>
          <Link href="/assignment">
            <button className="w-full flex items-center space-x-2 mt-2 hover:bg-gray-200 active:bg-gray-300 py-2 px-2 rounded-lg text-gray-500">
              <FileEditIcon className="w-4 h-4" />
              <span className="text-sm font-medium">Assignment</span>
            </button>
          </Link>
          <Link href="/settings">
            <button className="w-full flex items-center space-x-2 mt-2 hover:bg-gray-200 active:bg-gray-300 py-2 px-2 rounded-lg text-gray-500">
              <UserIcon className="w-4 h-4" />
              <span className="text-sm font-medium">Settings</span>
            </button>
          </Link>
        </nav>
      </div>
      <main className="flex-grow p-6">
        <div className="flex justify-between items-center mb-4">
          <h1 className="text-xl font-bold">Class</h1>
          <Link href="/class/create">
            <Button variant="default">Create/Join Class</Button>
          </Link>
        </div>
        <section>
          {/* <div className="flex justify-between items-center mb-4">
            <h2 className="text-lg font-semibold">My Upcoming Class</h2>
            <div className="flex"></div>
          </div> */}
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
            {classrooms.map(
              (classroom: {
                classroom_name: string;
                classroom_description: string;
                classroom_id: string;
                instructor: string;
              }) => {
                return (
                  <Link
                    key={classroom.classroom_id}
                    href={`/class/${classroom.classroom_id}`}
                  >
                    <Card className="w-full hover:shadow-md">
                      <CardContent>
                        <div className="flex justify-between items-center">
                          <div>
                            <h3 className="text-lg font-semibold mt-5">
                              {classroom.classroom_name}
                            </h3>
                            <p className="text-md text-gray-600">
                              Instructor: {classroom.instructor}
                            </p>
                            <p className="text-sm text-gray-600">
                              {classroom.classroom_description}
                            </p>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </Link>
                );
              }
            )}
          </div>
        </section>
      </main>
    </div>
  );
}
