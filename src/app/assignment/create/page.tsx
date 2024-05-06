/**
 * v0 by Vercel.
 * @see https://v0.dev/t/GkNjwEC
 * Documentation: https://v0.dev/docs#integrating-generated-code-into-your-nextjs-app
 */
"use client";
import { Button } from "@/components/ui/button";
import { CardContent, Card, CardFooter } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { ChangeEventHandler, useState } from "react";
import { getOwnedClassrooms } from "@/app/lib/function";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { hasCookie } from "cookies-next";

export default function Component() {
  const [classroomList, setClassroomList] = useState<any>([]);
  const [classroomId, setClassroomId] = useState("");
  const [assignmentName, setAssignmentName] = useState("");
  const [assignmentDescription, setAssignmentDescription] = useState("");
  const [possibleMarks, setPossibleMarks] = useState(0);
  const [dueDate, setDueDate] = useState("");
  const [files, setFiles] = useState<FileList | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  useEffect(() => {
    if (!hasCookie("jwt")) {
      router.push("/auth/login");
    }

    handleClassrooms();
  }, []);

  const handleClassrooms = async () => {
    const crms = await getOwnedClassrooms();
    const parsedCrms = await JSON.parse(crms);
    if (parsedCrms.status == 200) {
      setClassroomList(parsedCrms.data);
      return;
    }
  };

  const handleFileChange: ChangeEventHandler<HTMLInputElement> = (e) => {
    e.preventDefault();
    setFiles(e.target.files);
  };

  const handleCreateAssignment = async (
    event: React.FormEvent<HTMLFormElement>
  ) => {
    event.preventDefault();
    setIsProcessing(true);
    try {
      const formData = new FormData();
      formData.append("classroomId", classroomId);
      formData.append("assignmentName", assignmentName);
      formData.append("assignmentDescription", assignmentDescription);
      formData.append("possibleMarks", String(possibleMarks));
      formData.append("dueDate", dueDate);
      if (files) {
        Array.from(files).forEach((file, index) => {
          formData.append(`files[${index}]`, file);
        });
      }

      const response = await fetch("/api/create-assignment", {
        method: "POST",
        body: formData,
      });

      const parsedResponse = await response.json();
      if (parsedResponse.status == 200) {
        router.push("/assignment");
      } else {
        setError(parsedResponse.message);
        setIsProcessing(false);
        return;
      }
    } catch (err) {
      console.log(err);
      setIsProcessing(false);
      return;
    }
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-4">
        <h1 className="text-xl font-bold">Create Assignment</h1>
      </div>
      <div className="lg:flex lg:space-x-4">
        <Card className="w-full mb-5 h-min">
          <form onSubmit={handleCreateAssignment}>
            <CardContent>
              <div className="space-y-3 mt-7">
                <div className="grid w-full items-center gap-3">
                  <Label htmlFor="classroomId">Classroom</Label>
                  <Select
                    onValueChange={(value) => setClassroomId(value)}
                    // defaultValue={field.value}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select a classroom" />
                    </SelectTrigger>
                    <SelectContent>
                      {classroomList.map((classroom: any) => (
                        <SelectItem
                          key={classroom.classroom_id}
                          value={classroom.classroom_id}
                        >
                          {classroom.classroom_name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid w-full items-center gap-3">
                  <Label htmlFor="assignmentName">Assignment Name</Label>
                  <Input
                    type="text"
                    id="assignmentName"
                    onChange={(e) => setAssignmentName(e.target.value)}
                    value={assignmentName}
                    placeholder="Assignment Name"
                    required
                  />
                </div>
                <div className="grid w-full items-center gap-3">
                  <Label htmlFor="assignmentDescription">
                    Assignment Description
                  </Label>
                  <Textarea
                    id="assignmentDescription"
                    onChange={(e) => setAssignmentDescription(e.target.value)}
                    value={assignmentDescription}
                    placeholder="Assignment Description"
                  />
                </div>
                <div className="grid w-full items-center gap-3">
                  <Label htmlFor="assignmentMarks">Possible Marks</Label>
                  <Input
                    type="number"
                    id="assignmentMarks"
                    onChange={(e) => setPossibleMarks(Number(e.target.value))}
                    value={possibleMarks}
                    placeholder="Possible Marks"
                  />
                </div>
                <div className="grid w-full items-center gap-3">
                  <Label htmlFor="assignmentDue">Due At</Label>
                  <Input
                    type="datetime-local"
                    id="assignmentDue"
                    onChange={(e) => {
                      setDueDate(e.target.value);
                      console.log(e.target.value);
                    }}
                    value={dueDate}
                    required
                  />
                </div>
                <div className="grid w-full items-center gap-3">
                  <Label htmlFor="attach">References Files</Label>
                  <Input
                    type="file"
                    id="attach"
                    name="attach"
                    onChange={handleFileChange}
                    multiple
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
      </div>
    </div>
  );
}
