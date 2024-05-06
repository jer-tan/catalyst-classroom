"use client";
import { SVGProps, useState } from "react";
import Link from "next/link";
import {
  HomeIcon,
  BookIcon,
  FileEditIcon,
  MessageSquareIcon,
  UserIcon,
  RocketIcon,
} from "@/components/icon";

export default function DashboardLayout({
  children, // will be a page or nested layout
}: {
  children: React.ReactNode;
}) {
  const [isOpen, setIsOpen] = useState(false);
  return (
    <div className="flex flex-col md:flex-row h-screen">
      <div className="md:fixed">
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
            <button className="w-full flex items-center space-x-2 mt-2 hover:bg-gray-200 active:bg-gray-300 py-2 px-2 rounded-lg text-gray-500">
              <BookIcon className="w-4 h-4" />
              <span className="text-sm font-medium">Class</span>
            </button>
          </Link>
          <Link href="/assignment">
            <button className="w-full flex items-center space-x-2 mt-2 bg-gray-200 active:bg-gray-300 py-2 px-2 rounded-lg text-gray-800">
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
      <main className="flex-grow p-6 md:ml-56">{children}</main>
    </div>
  );
}
