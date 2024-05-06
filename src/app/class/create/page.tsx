/**
 * v0 by Vercel.
 * @see https://v0.dev/t/GkNjwEC
 * Documentation: https://v0.dev/docs#integrating-generated-code-into-your-nextjs-app
 */
"use client";
import { Button } from "@/components/ui/button";
import {
  CardTitle,
  CardHeader,
  CardContent,
  Card,
  CardFooter,
} from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { ChangeEvent, JSX, SVGProps, use } from "react";
import Link from "next/link";
import { useState } from "react";
import {
  checkClassroomId,
  createClassroom,
  joinClassroom,
} from "@/app/lib/function";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { hasCookie } from "cookies-next";
import { RocketIcon } from "@/components/icon";

export default function Component() {
  const [classroomIdError, setClassroomIdError] = useState<string | null>(null);
  const [classroomIdErrorClass, setClassroomIdErrorClass] =
    useState<string>("");
  const [classroomIdBottomErrorClass, setClassroomIdBottomErrorClass] =
    useState<string>("");
  const [error, setError] = useState<string | null>(null);
  const [classroomId, setClassroomId] = useState<string>("");
  const [classroomName, setClassroomName] = useState<string>("");
  const [classroomDescription, setClassroomDescription] = useState<string>("");
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [timer, setTimer] = useState<any>(null);
  const [inviteCode, setInviteCode] = useState<string>("");
  const [joinProcessing, setJoinProcessing] = useState<boolean>(false);
  const [joinError, setJoinError] = useState<string | null>(null);
  const router = useRouter();

  useEffect(() => {
    if (!hasCookie("jwt")) {
      router.push("/auth/login");
    }
  }, []);

  const classroomIdInputChanged = (e: ChangeEvent<HTMLInputElement>) => {
    setClassroomId(e.target.value);

    clearTimeout(timer);

    const newTimer = setTimeout(() => {
      doneTyping(e.target.value);
    }, 500);

    setTimer(newTimer);
  };

  const doneTyping = async (value: string) => {
    if (value.length < 3) {
      setClassroomIdBottomErrorClass("text-sm text-red-500 mb-2");
      setClassroomIdError("Classroom ID should be at least 3 characters long");
      setClassroomIdErrorClass("border-solid border-red-500 border-2");
      return;
    }
    const respones = await checkClassroomId(value);
    const parsedResponse = await JSON.parse(respones);
    if (parsedResponse.status == 404) {
      setClassroomIdErrorClass("");
      setClassroomIdBottomErrorClass("text-sm mb-2");
      setClassroomIdError("Classroom ID is available");
    } else if (parsedResponse.status == 200) {
      setClassroomIdError("Classroom ID already exists");
      setClassroomIdErrorClass("border-solid border-red-500 border-2");
      setClassroomIdBottomErrorClass("text-sm text-red-500 mb-2");
      return;
    } else {
      setClassroomIdError(
        "An error occurs while checking classroom ID availability"
      );
      setClassroomIdErrorClass("border-solid border-red-500 border-2");
      setClassroomIdBottomErrorClass("text-sm text-red-500 mb-2");
      return;
    }
  };

  const handleCreateClassroom = async (
    event: React.FormEvent<HTMLFormElement>
  ) => {
    event.preventDefault();
    setIsProcessing(true);
    const response = await createClassroom(
      classroomId,
      classroomName,
      classroomDescription
    );
    const parsedResponse = JSON.parse(response);
    if (parsedResponse.status == 200) {
      setClassroomIdErrorClass("");
      setClassroomIdError(null);
      setError(null);
      router.push("/class");
    } else if (parsedResponse.message == "Classroom ID already exists") {
      setClassroomIdError(parsedResponse.message);
      setClassroomIdErrorClass("border-solid border-red-500 border-2");
      setClassroomIdBottomErrorClass("text-sm text-red-500 mb-2");
      setIsProcessing(false);
      setError(null);
      return;
    } else {
      setError(parsedResponse.message);
      setIsProcessing(false);
      setClassroomIdErrorClass("");
      setClassroomIdError(null);
      return;
    }
  };

  const handleJoinClassroom = async (
    event: React.FormEvent<HTMLFormElement>
  ) => {
    event.preventDefault();
    setJoinProcessing(true);
    const response = await joinClassroom(inviteCode);
    const parsedResponse = JSON.parse(response);
    if (parsedResponse.status == 200) {
      setJoinError(null);
      router.push("/class");
    } else {
      setJoinError(parsedResponse.message);
      setJoinProcessing(false);
      return;
    }
  };
  return (
    <div className="flex">
      <aside className="sticky top-0 h-screen w-56 bg-gray-100 text-gray-800 p-4">
        <Link href="/dashboard">
          <div className="flex items-center space-x-2">
            <RocketIcon className=" text-gray-900 dark:text-gray-50" />
            <h1 className="text-lg font-medium">Catalyst</h1>
          </div>
        </Link>
        <nav className="space-y-2">
          <Link href="/dashboard">
            <button className="w-full flex items-center space-x-2 mt-2 hover:bg-gray-200 active:bg-gray-300 py-2 px-2 rounded-lg text-gray-500">
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
            <button className="w-full flex items-center space-x-2 mt-2 hover:bg-gray-200 active:bg-gray-300 py-2 px-2 rounded-lg text-gray-500">
              <FileEditIcon className="w-4 h-4" />
              <span className="text-sm font-medium">Assignment</span>
            </button>
          </Link>
          <Link href="/chat">
            <button className="w-full flex items-center space-x-2 mt-2 hover:bg-gray-200 active:bg-gray-300 py-2 px-2 rounded-lg text-gray-500">
              <MessageSquareIcon className="w-4 h-4" />
              <span className="text-sm font-medium">Chat</span>
            </button>
          </Link>
          <Link href="/settings">
            <button className="w-full flex items-center space-x-2 mt-2 hover:bg-gray-200 active:bg-gray-300 py-2 px-2 rounded-lg text-gray-500">
              <UserIcon className="w-4 h-4" />
              <span className="text-sm font-medium">Settings</span>
            </button>
          </Link>
        </nav>
      </aside>
      <main className="flex-grow p-6">
        <div className="flex justify-between items-center mb-4">
          <h1 className="text-xl font-bold">Create/Join Classroom</h1>
        </div>
        <div className="lg:flex lg:space-x-4">
          <Card className="w-full mb-5 h-min">
            <form onSubmit={handleCreateClassroom}>
              <CardHeader className="font-bold text-lg">
                Create Classroom
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="grid w-full items-center gap-3">
                    <Label htmlFor="classroomId">Classroom ID</Label>
                    <Input
                      type="text"
                      id="classroomId"
                      onChange={(e) => classroomIdInputChanged(e)}
                      value={classroomId}
                      placeholder="Classroom ID"
                      className={classroomIdErrorClass}
                      required
                    />
                    {classroomIdError ? (
                      <p className={classroomIdBottomErrorClass}>
                        {classroomIdError}
                      </p>
                    ) : (
                      <p className="text-sm text-gray-600 mb-2">
                        It has to be unique and you are not allowed to change
                        this ID in the future.
                      </p>
                    )}
                  </div>
                  <div className="grid w-full items-center gap-3">
                    <Label htmlFor="classroomName">Classroom Name</Label>
                    <Input
                      type="text"
                      id="classroomName"
                      onChange={(e) => setClassroomName(e.target.value)}
                      value={classroomName}
                      placeholder="Classroom Name"
                      required
                    />
                  </div>
                  <div className="grid w-full items-center gap-3">
                    <Label htmlFor="classroomDescription">
                      Classroom Description
                    </Label>
                    <Input
                      type="text"
                      id="classroomDescription"
                      onChange={(e) => setClassroomDescription(e.target.value)}
                      value={classroomDescription}
                      placeholder="Classroom Description"
                    />
                  </div>
                  {error && (
                    <p className="text-sm text-red-500 mb-2 font-semibold">
                      {error}
                    </p>
                  )}
                </div>
              </CardContent>
              <CardFooter className="flex justify-end">
                <Button type="submit" disabled={isProcessing}>
                  {isProcessing ? <span>Creating</span> : <span>Create</span>}
                </Button>
              </CardFooter>
            </form>
          </Card>
          <Card className="w-full mb-5 h-auto">
            <form onSubmit={handleJoinClassroom}>
              <CardHeader className="font-bold text-lg">
                Join Classroom
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="grid w-full items-center gap-3">
                    <Label htmlFor="classroomInviteCode">
                      Classroom Invite Code
                    </Label>
                    <Input
                      type="text"
                      id="classroomInviteCode"
                      onChange={(e) => setInviteCode(e.target.value)}
                      value={inviteCode}
                      placeholder="Classroom Invite Code"
                      required
                    />
                    {joinError ? (
                      <p className="text-sm text-red-500 mb-2 font-semibold">
                        {joinError}
                      </p>
                    ) : (
                      <p className="text-sm text-gray-600 mb-2">
                        Example: TCS93LSC
                      </p>
                    )}
                  </div>
                </div>
              </CardContent>
              <CardFooter className="flex justify-end">
                <Button type="submit" disabled={joinProcessing}>
                  {joinProcessing ? <span>Joining</span> : <span>Join</span>}
                </Button>
              </CardFooter>
            </form>
          </Card>
          {/* <Card className="w-full mb-5">
            <CardHeader>
              <div className="flex justify-between">
                <h1 className="font-bold text-lg">Participants</h1>
                <Button variant="secondary" className="hover:bg-slate-300">
                  Add
                </Button>
              </div>
            </CardHeader>
            <div className="px-5 space-y-3 mb-5">
              <Card>
                <div className="space-y-3">
                  <CardContent>
                    <div className="flex justify-between items-center mt-2">
                      <div className="flex items-center space-x-2 space-y-2">
                        <img
                          alt="User Avatar"
                          height="30"
                          src="https://t3.ftcdn.net/jpg/02/43/12/34/360_F_243123463_zTooub557xEWABDLk0jJklDyLSGl2jrr.jpg"
                          style={{
                            aspectRatio: "30/30",
                            objectFit: "cover",
                          }}
                          className="rounded-full mt-3"
                          width="30"
                        />
                        <h1 className="text-lg font-medium">John Doe</h1>
                      </div>
                      <div className="mt-3">
                        <Select>
                          <SelectTrigger className="w-[180px]">
                            <SelectValue placeholder="Select a fruit" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectGroup>
                              <SelectItem value="apple">Apple</SelectItem>
                              <SelectItem value="banana">Banana</SelectItem>
                              <SelectItem value="blueberry">
                                Blueberry
                              </SelectItem>
                              <SelectItem value="grapes">Grapes</SelectItem>
                              <SelectItem value="pineapple">
                                Pineapple
                              </SelectItem>
                            </SelectGroup>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                  </CardContent>
                </div>
              </Card>
              <Card>
                <div className="space-y-3">
                  <CardContent>
                    <div className="flex justify-between items-center mt-2">
                      <div className="flex items-center space-x-2">
                        <img
                          alt="User Avatar"
                          height="30"
                          src="https://t3.ftcdn.net/jpg/02/43/12/34/360_F_243123463_zTooub557xEWABDLk0jJklDyLSGl2jrr.jpg"
                          style={{
                            aspectRatio: "30/30",
                            objectFit: "cover",
                          }}
                          className="rounded-full mt-3"
                          width="30"
                        />
                        <h1 className="text-lg font-medium">John Doe</h1>
                      </div>
                      <div className="mt-3">
                        <Select>
                          <SelectTrigger className="w-[180px]">
                            <SelectValue placeholder="Select a fruit" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectGroup>
                              <SelectItem value="apple">Apple</SelectItem>
                              <SelectItem value="banana">Banana</SelectItem>
                              <SelectItem value="blueberry">
                                Blueberry
                              </SelectItem>
                              <SelectItem value="grapes">Grapes</SelectItem>
                              <SelectItem value="pineapple">
                                Pineapple
                              </SelectItem>
                            </SelectGroup>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                  </CardContent>
                </div>
              </Card>
              <Card>
                <div className="space-y-3">
                  <CardContent>
                    <div className="flex justify-between items-center mt-2">
                      <div className="flex items-center space-x-2">
                        <img
                          alt="User Avatar"
                          height="30"
                          src="https://t3.ftcdn.net/jpg/02/43/12/34/360_F_243123463_zTooub557xEWABDLk0jJklDyLSGl2jrr.jpg"
                          style={{
                            aspectRatio: "30/30",
                            objectFit: "cover",
                          }}
                          className="rounded-full mt-3"
                          width="30"
                        />
                        <h1 className="text-lg font-medium">John Doe</h1>
                      </div>
                      <div className="mt-3">
                        <Select>
                          <SelectTrigger className="w-[180px]">
                            <SelectValue placeholder="Select a fruit" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectGroup>
                              <SelectItem value="apple">Apple</SelectItem>
                              <SelectItem value="banana">Banana</SelectItem>
                              <SelectItem value="blueberry">
                                Blueberry
                              </SelectItem>
                              <SelectItem value="grapes">Grapes</SelectItem>
                              <SelectItem value="pineapple">
                                Pineapple
                              </SelectItem>
                            </SelectGroup>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                  </CardContent>
                </div>
              </Card>
              <Card>
                <div className="space-y-3">
                  <CardContent>
                    <div className="flex justify-between items-center mt-2">
                      <div className="flex items-center space-x-2">
                        <img
                          alt="User Avatar"
                          height="30"
                          src="https://t3.ftcdn.net/jpg/02/43/12/34/360_F_243123463_zTooub557xEWABDLk0jJklDyLSGl2jrr.jpg"
                          style={{
                            aspectRatio: "30/30",
                            objectFit: "cover",
                          }}
                          className="rounded-full mt-3"
                          width="30"
                        />
                        <h1 className="text-lg font-medium">John Doe</h1>
                      </div>
                      <div className="mt-3">
                        <Select>
                          <SelectTrigger className="w-[180px]">
                            <SelectValue placeholder="Select a fruit" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectGroup>
                              <SelectItem value="apple">Apple</SelectItem>
                              <SelectItem value="banana">Banana</SelectItem>
                              <SelectItem value="blueberry">
                                Blueberry
                              </SelectItem>
                              <SelectItem value="grapes">Grapes</SelectItem>
                              <SelectItem value="pineapple">
                                Pineapple
                              </SelectItem>
                            </SelectGroup>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                  </CardContent>
                </div>
              </Card>
            </div>
          </Card> */}
        </div>
      </main>
    </div>
  );
}

function FileEditIcon(
  props: JSX.IntrinsicAttributes & SVGProps<SVGSVGElement>
) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M4 13.5V4a2 2 0 0 1 2-2h8.5L20 7.5V20a2 2 0 0 1-2 2h-5.5" />
      <polyline points="14 2 14 8 20 8" />
      <path d="M10.42 12.61a2.1 2.1 0 1 1 2.97 2.97L7.95 21 4 22l.99-3.95 5.43-5.44Z" />
    </svg>
  );
}

function HomeIcon(props: JSX.IntrinsicAttributes & SVGProps<SVGSVGElement>) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
      <polyline points="9 22 9 12 15 12 15 22" />
    </svg>
  );
}

function BookIcon(props: JSX.IntrinsicAttributes & SVGProps<SVGSVGElement>) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M4 19.5v-15A2.5 2.5 0 0 1 6.5 2H20v20H6.5a2.5 2.5 0 0 1 0-5H20" />
    </svg>
  );
}

function MessageSquareIcon(
  props: JSX.IntrinsicAttributes & SVGProps<SVGSVGElement>
) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
    </svg>
  );
}

function UserIcon(props: JSX.IntrinsicAttributes & SVGProps<SVGSVGElement>) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2" />
      <circle cx="12" cy="7" r="4" />
    </svg>
  );
}
