"use client";
import Link from "next/link";
import { useState, useEffect } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  HomeIcon,
  BookIcon,
  FileEditIcon,
  MessageSquareIcon,
  UserIcon,
  FileTextIcon,
  BotIcon,
  TrashIcon,
  RocketIcon,
} from "@/components/icon";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";
import { hasCookie } from "cookies-next";
import {
  deleteMaterial,
  deleteRecording,
  getClassroomInformation,
} from "@/app/lib/function";
import { Input } from "@/components/ui/input";
import { VideoIcon } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

export default function Page({ params }: { params: { id: string } }) {
  const [isOpen, setIsOpen] = useState(false);
  const [inviteCode, setInviteCode] = useState("********");
  const [classroomInfo, setClassroomInfo] = useState<any>({
    inviteCode: "********",
  });
  const [materials, setMaterials] = useState<any>([]);
  const [materialUpload, setMaterialUpload] = useState<FileList | null>(null);
  const [recordings, setRecordings] = useState<any>([]);
  const [assignments, setAssignments] = useState<any>([]);

  const [dialogOpen, setDialogOpen] = useState(false);
  const [dialogTitle, setDialogTitle] = useState(
    "Generating Summary of the document..."
  );
  const [dialogDescription, setDialogDescription] =
    useState<string>("<p>Loading...</p>");

  const router = useRouter();

  useEffect(() => {
    if (!hasCookie("jwt")) {
      return router.push("/auth/login");
    }

    classroomInfoArranger();
  }, []);

  const handleMouseEnter = () => {
    setInviteCode(classroomInfo.invite_code || "********");
  };

  const handleMouseLeave = () => {
    setInviteCode("********");
  };

  const classroomInfoArranger = async () => {
    const classroomInfo = await getClassroomInformation(params.id);
    const parsedClassroomInfo = JSON.parse(classroomInfo);
    setClassroomInfo(parsedClassroomInfo.classroomResponse);
    setMaterials(parsedClassroomInfo.materials);
    setAssignments(parsedClassroomInfo.assignments);
    setRecordings(parsedClassroomInfo.recordings.data);
    console.log(parsedClassroomInfo);
  };

  const handleCopyClick = async () => {
    try {
      await navigator.clipboard.writeText(inviteCode);
    } catch (error) {
      console.error("Error copying invite code:", error);
    }
  };

  const onMaterialUploadButtonClicked = (e: any) => {
    //e.preventDefault();
    const fileInput = document.getElementById(
      "materialUploadInput"
    ) as HTMLInputElement;
    fileInput.click();
  };

  const handleMaterialUpload = async (files: FileList | null) => {
    if (!files) {
      console.log("No files selected");
      return;
    }
    const formData = new FormData();
    formData.append("classroomId", params.id);
    if (files) {
      Array.from(files).forEach((file, index) => {
        formData.append(`files[${index}]`, file);
      });
    }
    console.log(formData);
    const response = await fetch("/api/upload-material", {
      method: "POST",
      body: formData,
    });
    const data = await response.json();
    console.log(data);
    if (data.status !== 200) {
      alert("An error occured when uploading material");
    }
    await classroomInfoArranger();
  };

  const handleMaterialDelete = async (key: any) => {
    const deleteAction = await deleteMaterial(key, params.id);
    const deleteActionResponse = await JSON.parse(deleteAction);
    if (deleteActionResponse.status !== 200) {
      alert("An error occured when deleting material");
    }
    await classroomInfoArranger();
  };

  const handleRecordingDelete = async (recordingId: any) => {
    const deleteAction = await deleteRecording(recordingId);
    const deleteActionResponse = await JSON.parse(deleteAction);
    if (deleteActionResponse.status !== 200) {
      alert("An error occured when deleting material");
    }
    await classroomInfoArranger();
  };

  const aiMaterial = async (materialKey: string) => {
    setDialogTitle("Generating Summary of the document...");
    setDialogDescription("<p>Loading...</p>");
    setDialogOpen(true);
    const formData = new FormData();
    formData.append("key", materialKey);

    let aiSummary = await fetch("/api/ai-assistance", {
      method: "POST",
      body: formData,
    });
    let parsedAiSummary = await aiSummary.json();
    let des = await parsedAiSummary.response
      .replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>")
      .replace(/\\n/g, "<br>");
    // TODO: Show the assignment detail in a modal
    if (parsedAiSummary.status !== 200) {
      return alert("An error occured when fetching AI summary");
    }
    setDialogTitle("AI Summary of " + parsedAiSummary.document_name);
    setDialogDescription(des);
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
            <button className="w-full flex items-center space-x-2 mt-2 hover:bg-gray-200 active:bg-gray-300 py-2 px-2 rounded-lg text-gray-500">
              <UserIcon className="w-4 h-4" />
              <span className="text-sm font-medium">Settings</span>
            </button>
          </Link>
        </nav>
      </div>
      <main className="flex-grow p-6 md:ml-56">
        <h1 className="text-3xl mb-3 font-semibold">
          {classroomInfo && classroomInfo.classroom_name
            ? classroomInfo.classroom_name
            : "Classroom Name"}
        </h1>
        <p className="mb-1">
          Invite Code:{" "}
          <span
            onMouseEnter={handleMouseEnter}
            onMouseLeave={handleMouseLeave}
            onClick={handleCopyClick}
            className="cursor-pointer "
          >
            {inviteCode}
          </span>
        </p>
        <p className="mb-3">
          {classroomInfo && classroomInfo.classroom_description
            ? classroomInfo.classroom_description
            : "Classroom description"}
        </p>
        <Tabs defaultValue="overview" className="w-auto">
          <TabsList>
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="materials">Materials</TabsTrigger>
            <TabsTrigger value="recordings">Recordings</TabsTrigger>
            <TabsTrigger value="assignments">Assignments</TabsTrigger>
          </TabsList>
          <TabsContent value="overview">
            <h2 className="text-xl font-semibold my-4">Upcoming Class</h2>
            <Card className="w-full">
              <CardContent>
                <div className="flex justify-between items-center">
                  <div>
                    <h3 className="text-md font-semibold mt-4">
                      Your Classroom
                    </h3>
                  </div>
                  <div className="flex items-center mt-4">
                    <Link href={`/class/${params.id}/room`}>
                      <Button variant="outline">Join</Button>
                    </Link>
                  </div>
                </div>
              </CardContent>
            </Card>
            <h2 className="text-xl font-semibold my-4">Assignments</h2>
            <div className="grid gap-3">
              {assignments.map((assignment: any) => {
                if (new Date(assignment.due_at) < new Date()) {
                  return;
                }
                return (
                  <Link
                    href={`/assignment/${assignment.id}`}
                    key={assignment.id}
                  >
                    <Card className="w-full hover:shadow-md">
                      <CardContent>
                        <div className="flex justify-between items-center">
                          <div>
                            <h3 className="text-md font-semibold mt-4">
                              {assignment.name}
                            </h3>
                            <p className="text-sm text-gray-600">
                              Due {new Date(assignment.due_at).toLocaleString()}
                            </p>
                          </div>
                          <div className="flex items-center mt-4">
                            <p>
                              {assignment.possible_marks == 0
                                ? "Ungraded"
                                : assignment.possible_marks + " Marks"}{" "}
                            </p>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </Link>
                );
              })}
            </div>
          </TabsContent>
          <TabsContent value="materials">
            <div className="flex justify-between items-center mb-4 mt-2">
              <h2 className="text-xl font-semibold">Materials</h2>
              {classroomInfo.user_role === "Instructor" && (
                <Button
                  variant="outline"
                  onClick={onMaterialUploadButtonClicked}
                >
                  <Input
                    type="file"
                    id="materialUploadInput"
                    multiple
                    className="hidden"
                    onChange={(e) => {
                      handleMaterialUpload(e.target.files);
                    }}
                  />
                  Upload
                </Button>
              )}
            </div>
            {materials.map((file: any) => (
              <a href={file.url} key={file.url} target="_blank">
                <div className="border border-gray-300 hover:bg-gray-100 rounded cursor-pointer mb-2">
                  <p className="p-2 text-sm">
                    <div className="justify-between flex">
                      <div className="flex">
                        <FileTextIcon className="h-full mr-2" />
                        {file.fileName}
                      </div>
                      <div className="flex">
                        <BotIcon
                          className="h-4/5 mr-2 hover:text-blue-400 z-10"
                          onClick={(e) => {
                            e.preventDefault();
                            aiMaterial(file.key);
                          }}
                        />
                        {classroomInfo.user_role === "Instructor" && (
                          <TrashIcon
                            className="h-4/5 mr-2 hover:text-red-500"
                            onClick={(e) => {
                              e.preventDefault();
                              // console.log(file);
                              handleMaterialDelete(file.key);
                            }}
                          />
                        )}
                      </div>
                    </div>
                  </p>
                </div>
              </a>
            ))}
            <Dialog
              open={dialogOpen}
              onOpenChange={() => setDialogOpen(!dialogOpen)}
            >
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>{dialogTitle}</DialogTitle>
                  <DialogDescription className="overflow-auto max-h-96">
                    <div
                      dangerouslySetInnerHTML={{ __html: dialogDescription }}
                    />
                  </DialogDescription>
                </DialogHeader>
              </DialogContent>
            </Dialog>
          </TabsContent>
          <TabsContent value="recordings">
            <h2 className="text-xl font-semibold my-4">Recordings</h2>
            {recordings.map((recording: any) => {
              if (!recording.file) {
                return;
              }
              return (
                <Link href={recording.file?.fileUrl || "#"} key={recording.id}>
                  <div className="border border-gray-300 hover:bg-gray-100 rounded cursor-pointer mb-2">
                    <p className="p-2 text-sm">
                      <div className="justify-between flex">
                        <div className="flex">
                          <VideoIcon className="h-full mr-2" />
                          Recording at{" "}
                          {new Date(recording.file.createdAt).toLocaleString()}
                        </div>
                        <div className="flex">
                          {classroomInfo.user_role === "Instructor" && (
                            <TrashIcon
                              className="h-4/5 mr-2 hover:text-red-500 z-10"
                              onClick={(e) => {
                                e.preventDefault();
                                handleRecordingDelete(recording.id);
                              }}
                            />
                          )}
                        </div>
                      </div>
                    </p>
                  </div>
                </Link>
              );
            })}
          </TabsContent>
          <TabsContent value="assignments">
            <h2 className="text-xl font-semibold my-4">Assignments</h2>
            <Tabs defaultValue="upcoming" className="mb-2">
              <TabsList>
                <TabsTrigger value="upcoming">Upcoming</TabsTrigger>
                <TabsTrigger value="past">Past</TabsTrigger>
              </TabsList>
              <TabsContent value="upcoming" className="mb-2">
                <div className="grid gap-y-3">
                  {assignments.map((assignment: any) => {
                    if (new Date(assignment.due_at) > new Date()) {
                      return (
                        <Link
                          href={"/assignment/" + String(assignment.id)}
                          key={assignment.id}
                        >
                          <Card className="w-full hover:shadow-md">
                            <CardContent>
                              <div className="flex justify-between items-center">
                                <div>
                                  <h3 className="text-md font-semibold mt-4">
                                    {assignment.name}
                                  </h3>
                                  <p className="text-sm text-gray-600">
                                    Due at{" "}
                                    {new Date(
                                      assignment?.due_at
                                    )?.toLocaleString()}
                                  </p>
                                </div>
                                <div className="flex items-center mt-4">
                                  <p>
                                    {assignment.possible_marks == 0
                                      ? "Ungraded"
                                      : assignment.possible_marks + " Marks"}
                                  </p>
                                </div>
                              </div>
                            </CardContent>
                          </Card>
                        </Link>
                      );
                    }
                  })}
                </div>
              </TabsContent>
              <TabsContent value="past">
                <div className="grid gap-y-3">
                  {assignments.map((assignment: any) => {
                    if (new Date(assignment.due_at) < new Date()) {
                      return (
                        <Link
                          href={"/assignment/" + String(assignment.id)}
                          key={assignment.id}
                        >
                          <Card className="w-full hover:shadow-md">
                            <CardContent>
                              <div className="flex justify-between items-center">
                                <div>
                                  <h3 className="text-md font-semibold mt-4">
                                    {assignment.name}
                                  </h3>
                                  <p className="text-sm text-gray-600">
                                    Due at{" "}
                                    {new Date(
                                      assignment?.due_at
                                    )?.toLocaleString()}
                                  </p>
                                </div>
                                <div className="flex items-center mt-4">
                                  <p>
                                    {assignment.possible_marks == 0
                                      ? "Ungraded"
                                      : assignment.possible_marks + " Marks"}
                                  </p>
                                </div>
                              </div>
                            </CardContent>
                          </Card>
                        </Link>
                      );
                    }
                  })}
                </div>
              </TabsContent>
            </Tabs>
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
}
