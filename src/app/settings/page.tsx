"use client";
import { Button } from "@/components/ui/button";
import {
  CardHeader,
  CardContent,
  Card,
  CardFooter,
} from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import Link from "next/link";
import { JSX, SVGProps, useEffect, useState } from "react";
import { hasCookie, deleteCookie } from "cookies-next";
import { useRouter } from "next/navigation";
import {
  updateAccountInformation,
  updateAccountPassword,
  userInformation,
} from "../lib/function";
import { RocketIcon } from "@/components/icon";

export default function Component() {
  const [isOpen, setIsOpen] = useState(false);
  const [name, setName] = useState<string>("");
  const [username, setUsername] = useState<string>("");
  const [email, setEmail] = useState<string>("");
  const [oldpassword, setOldPassword] = useState<string>("");
  const [newpassword, setNewPassword] = useState<string>("");
  const [newReenterPassword, setNewReenterPassword] = useState<string>("");
  const router = useRouter();

  useEffect(() => {
    if (!hasCookie("jwt")) {
      router.push("/auth/login");
    }

    // Fetch user data
    fetchUserData();
  }, []);

  async function fetchUserData() {
    // Fetch user data
    const userInfo = await userInformation();
    const userInfoJson = await JSON.parse(userInfo);
    console.log(userInfoJson);
    setName(userInfoJson[0].name);
    setUsername(userInfoJson[0].username);
    setEmail(userInfoJson[0].email);
  }

  const handleAccountUpdateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const updateAccountResponse = await updateAccountInformation(name, email);
    const updateAccountResponseJson = await JSON.parse(updateAccountResponse);
    if (updateAccountResponseJson.status == 200) {
      alert("Account updated successfully");
    } else {
      alert("An error occurred while updating account");
    }
  };

  const handlePasswordUpdateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const updatePasswordResponse = await updateAccountPassword(
      oldpassword,
      newpassword
    );
    const updatePasswordResponseJson = await JSON.parse(updatePasswordResponse);
    if (updatePasswordResponseJson.status == 200) {
      alert("Password updated successfully");
    } else {
      alert(updatePasswordResponseJson.message);
    }
  };

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
            <button className="w-full flex items-center space-x-2 mt-2 hover:bg-gray-200 active:bg-gray-300 py-2 px-2 rounded-lg text-gray-500">
              <FileEditIcon className="w-4 h-4" />
              <span className="text-sm font-medium">Assignment</span>
            </button>
          </Link>
          <Link href="/settings">
            <button className="w-full flex items-center space-x-2 mt-2 bg-gray-200 active:bg-gray-300 py-2 px-2 rounded-lg text-gray-800">
              <UserIcon className="w-4 h-4" />
              <span className="text-sm font-medium">Settings</span>
            </button>
          </Link>
        </nav>
      </div>
      <main className="flex-grow p-6 md:ml-56">
        <div className="flex justify-between items-center mb-4">
          <h1 className="text-xl font-bold">Settings</h1>
        </div>

        <div className="md:flex md:space-x-4">
          <Card className="w-full mb-5">
            <form onSubmit={handleAccountUpdateSubmit}>
              <CardHeader className="font-bold">Basic Information</CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="grid w-full items-center gap-3">
                    <Label htmlFor="username">Username</Label>
                    <Input
                      type="text"
                      id="username"
                      placeholder="Username"
                      value={username}
                      onChange={(e) => setUsername(e.target.value)}
                      disabled
                    />
                  </div>
                  <div className="grid w-full items-center gap-3">
                    <Label htmlFor="name">Full Name</Label>
                    <Input
                      type="text"
                      id="name"
                      placeholder="Name"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                    />
                  </div>
                  <div className="grid w-full items-center gap-3">
                    <Label htmlFor="email">Email address</Label>
                    <Input
                      type="email"
                      id="email"
                      placeholder="Email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                    />
                  </div>
                </div>
              </CardContent>
              <CardFooter className="flex justify-end">
                <Button>Save</Button>
              </CardFooter>
            </form>
          </Card>

          <Card className="w-full mb-5">
            <form onSubmit={handlePasswordUpdateSubmit}>
              <CardHeader className="font-bold">Security</CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="grid w-full items-center gap-3">
                    <Label htmlFor="email">Old Password</Label>
                    <Input
                      type="password"
                      id="password"
                      placeholder="**********"
                      value={oldpassword}
                      onChange={(e) => setOldPassword(e.target.value)}
                    />
                  </div>
                  <div className="grid w-full items-center gap-3">
                    <Label htmlFor="email">New Password</Label>
                    <Input
                      type="password"
                      id="new-password"
                      placeholder="**********"
                      value={newpassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                    />
                  </div>
                  <div className="grid w-full items-center gap-3">
                    <Label htmlFor="email">Re-enter New Password</Label>
                    <Input
                      type="password"
                      id="reenter-new-password"
                      placeholder="**********"
                      value={newReenterPassword}
                      onChange={(e) => setNewReenterPassword(e.target.value)}
                    />
                  </div>
                </div>
              </CardContent>
              <CardFooter className="flex justify-end">
                <Button>Change Password</Button>
              </CardFooter>
            </form>
          </Card>
        </div>
        <Card className="w-full mb-5">
          <CardHeader className="font-bold">Do you want to Logout?</CardHeader>
          <CardFooter className="flex justify-end">
            <Button
              className="hover:bg-red-500"
              onClick={async (e) => {
                e.preventDefault();
                await deleteCookie("jwt");
                router.push("/");
              }}
            >
              Yes, Log me out
            </Button>
          </CardFooter>
        </Card>
        {/* <div>
             <Card className="w-full mb-5">
              <CardHeader>
                <div className="flex justify-between">
                  <div className="font-bold">Your Organization</div>
                  <Button>Create or Join</Button>
                </div>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-[100px]">Identifier</TableHead>
                      <TableHead>Name</TableHead>
                      <TableHead>Role</TableHead>
                      <TableHead className="text-right">Action</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    <TableRow>
                      <TableCell className="font-medium">MCKL</TableCell>
                      <TableCell>Methodist College Kuala Lumpur</TableCell>
                      <TableCell>Learner</TableCell>
                      <TableCell className="text-right space-x-2">
                        <Button variant="outline">
                          <ViewIcon className="h-4 w-4 mr-1" />
                          View
                        </Button>
                        <Button>
                          <ExitIcon className="h-4 w-4 mr-1" />
                          Leave
                        </Button>
                      </TableCell>
                    </TableRow>
                    <TableRow>
                      <Dialog>
                        <TableCell className="font-medium">JTPT</TableCell>
                        <TableCell>Jerome's Private Tutor</TableCell>
                        <TableCell>Admin</TableCell>
                        <TableCell className="text-right space-x-2">
                          <DialogTrigger>
                            <Button>
                              <ManageIcon className="h-4 w-4 mr-1" />
                              Manage
                            </Button>
                          </DialogTrigger>
                          <DialogContent className="md:max-w-screen-md lg:max-w-screen-lg xl:max-w-screen-xl ">
                            <DialogHeader>
                              <DialogTitle>Jerome's Private Tutor</DialogTitle>
                            </DialogHeader>
                            <DialogDescription>
                              This action cannot be undone. This will
                              permanently delete your account and remove your
                              data from our servers.
                            </DialogDescription>
                            <Table>
                              <TableHeader>
                                <TableRow>
                                  <TableHead className="w-[100px]">
                                    Username
                                  </TableHead>
                                  <TableHead>Name</TableHead>
                                  <TableHead>Role</TableHead>
                                  <TableHead className="text-right">
                                    Action
                                  </TableHead>
                                </TableRow>
                              </TableHeader>
                              <TableBody>
                                <TableRow>
                                  <TableCell className="font-medium">
                                    jeromesocial1269
                                  </TableCell>
                                  <TableCell>Jerome Tan </TableCell>
                                  <TableCell>
                                    <Select>
                                      <SelectTrigger className="w-[180px]">
                                        <SelectValue placeholder="Select a fruit" />
                                      </SelectTrigger>
                                      <SelectContent>
                                        <SelectGroup>
                                          <SelectLabel>Fruits</SelectLabel>
                                          <SelectItem value="apple">
                                            Apple
                                          </SelectItem>
                                          <SelectItem value="banana">
                                            Banana
                                          </SelectItem>
                                          <SelectItem value="blueberry">
                                            Blueberry
                                          </SelectItem>
                                          <SelectItem value="grapes">
                                            Grapes
                                          </SelectItem>
                                          <SelectItem value="pineapple">
                                            Pineapple
                                          </SelectItem>
                                        </SelectGroup>
                                      </SelectContent>
                                    </Select>
                                  </TableCell>
                                  <TableCell className="text-right">
                                    <Button className="hover:bg-red-500">
                                      <CloseIcon className="h-4 w-4 mt-0.5 mr-1" />
                                      Remove
                                    </Button>
                                  </TableCell>
                                </TableRow>
                                <TableRow>
                                  <TableCell className="font-medium">
                                    alextan124
                                  </TableCell>
                                  <TableCell>Alex Tan</TableCell>
                                  <TableCell>Admin</TableCell>
                                  <TableCell className="text-right space-x-2">
                                    <Button>
                                      <ManageIcon className="h-4 w-4 mr-1" />
                                      Manage
                                    </Button>
                                  </TableCell>
                                </TableRow>
                              </TableBody>
                            </Table>
                          </DialogContent>
                        </TableCell>
                      </Dialog>
                    </TableRow>
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </div> */}
      </main>
    </div>
  );
}

function DeleteIcon(props: JSX.IntrinsicAttributes & SVGProps<SVGSVGElement>) {
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
      <path d="M20 5H9l-7 7 7 7h11a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2Z" />
      <line x1="18" x2="12" y1="9" y2="15" />
      <line x1="12" x2="18" y1="9" y2="15" />
    </svg>
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

function BookOpenIcon(
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
      <path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z" />
      <path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z" />
    </svg>
  );
}

function CalendarIcon(
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
      <rect width="18" height="18" x="3" y="4" rx="2" ry="2" />
      <line x1="16" x2="16" y1="2" y2="6" />
      <line x1="8" x2="8" y1="2" y2="6" />
      <line x1="3" x2="21" y1="10" y2="10" />
    </svg>
  );
}

function CheckCircleIcon(
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
      <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
      <polyline points="22 4 12 14.01 9 11.01" />
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

function ExitIcon(props: JSX.IntrinsicAttributes & SVGProps<SVGSVGElement>) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      height="24"
      viewBox="0 -960 960 960"
      width="24"
      fill="white"
    >
      <path d="M200-120q-33 0-56.5-23.5T120-200v-560q0-33 23.5-56.5T200-840h280v80H200v560h280v80H200Zm440-160-55-58 102-102H360v-80h327L585-622l55-58 200 200-200 200Z" />
    </svg>
  );
}

function ViewIcon(props: JSX.IntrinsicAttributes & SVGProps<SVGSVGElement>) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      height="24"
      viewBox="0 -960 960 960"
      width="24"
    >
      <path d="M480-320q75 0 127.5-52.5T660-500q0-75-52.5-127.5T480-680q-75 0-127.5 52.5T300-500q0 75 52.5 127.5T480-320Zm0-72q-45 0-76.5-31.5T372-500q0-45 31.5-76.5T480-608q45 0 76.5 31.5T588-500q0 45-31.5 76.5T480-392Zm0 192q-146 0-266-81.5T40-500q54-137 174-218.5T480-800q146 0 266 81.5T920-500q-54 137-174 218.5T480-200Zm0-300Zm0 220q113 0 207.5-59.5T832-500q-50-101-144.5-160.5T480-720q-113 0-207.5 59.5T128-500q50 101 144.5 160.5T480-280Z" />
    </svg>
  );
}

function ManageIcon(props: JSX.IntrinsicAttributes & SVGProps<SVGSVGElement>) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      height="24"
      viewBox="0 -960 960 960"
      width="24"
      fill="white"
    >
      <path d="m370-80-16-128q-13-5-24.5-12T307-235l-119 50L78-375l103-78q-1-7-1-13.5v-27q0-6.5 1-13.5L78-585l110-190 119 50q11-8 23-15t24-12l16-128h220l16 128q13 5 24.5 12t22.5 15l119-50 110 190-103 78q1 7 1 13.5v27q0 6.5-2 13.5l103 78-110 190-118-50q-11 8-23 15t-24 12L590-80H370Zm70-80h79l14-106q31-8 57.5-23.5T639-327l99 41 39-68-86-65q5-14 7-29.5t2-31.5q0-16-2-31.5t-7-29.5l86-65-39-68-99 42q-22-23-48.5-38.5T533-694l-13-106h-79l-14 106q-31 8-57.5 23.5T321-633l-99-41-39 68 86 64q-5 15-7 30t-2 32q0 16 2 31t7 30l-86 65 39 68 99-42q22 23 48.5 38.5T427-266l13 106Zm42-180q58 0 99-41t41-99q0-58-41-99t-99-41q-59 0-99.5 41T342-480q0 58 40.5 99t99.5 41Zm-2-140Z" />
    </svg>
  );
}

function CloseIcon(props: JSX.IntrinsicAttributes & SVGProps<SVGSVGElement>) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      height="24"
      viewBox="0 -960 960 960"
      width="24"
      fill="white"
    >
      <path d="m256-200-56-56 224-224-224-224 56-56 224 224 224-224 56 56-224 224 224 224-56 56-224-224-224 224Z" />
    </svg>
  );
}
