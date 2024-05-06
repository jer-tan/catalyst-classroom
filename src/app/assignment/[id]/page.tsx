/**
 * v0 by Vercel.
 * @see https://v0.dev/t/GkNjwEC
 * Documentation: https://v0.dev/docs#integrating-generated-code-into-your-nextjs-app
 */
"use client";
import { Button } from "@/components/ui/button";
import { FileTextIcon } from "@/components/icon";
import { CardContent, Card } from "@/components/ui/card";
import Link from "next/link";
import React, { ChangeEventHandler, useEffect, useState } from "react";
import {
  getAssignmentInformation,
  getAssignmentSubmissionInformation,
  gradeAssignment,
} from "@/app/lib/function";
import { NextRequest } from "next/server";
import { useRouter } from "next/navigation";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { hasCookie } from "cookies-next";

export default function Component({ params }: { params: { id: string } }) {
  // console.log(params.id);
  const [isOpen, setIsOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [assignmentMeta, setAssignmentMeta] = useState<any>([]);
  const [assignmentInfo, setAssignmentInfo] = useState<any>(null);
  const [assignmentReferences, setAssignmentReferences] = useState<any>([]);
  const [role, setRole] = useState<string | null>(null);
  const [files, setFiles] = useState<FileList | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [dialogTitle, setDialogTitle] = useState<string | null>(
    "Submission detail of "
  );
  const [dialogDescription, setDialogDescription] = useState<string | null>(
    "loading..."
  );
  const [dialogAssignmentSubmittedFiles, setDialogAssignmentSubmittedFiles] =
    useState<any>([]);
  const [dialogAssignmentMeta, setDialogAssignmentMeta] = useState<any>([]);
  const [grade, setGrade] = useState<number | string>(0);
  const [dialogIsProcessing, setDialogIsProcessing] = useState<boolean>(false);
  const router = useRouter();

  useEffect(() => {
    if (!hasCookie("jwt")) {
      return router.push("/auth/login");
    }

    const fetchData = async () => {
      const assignments = await getAssignmentInformation(params.id);
      const parsedAssignments = JSON.parse(assignments as string);
      if (parsedAssignments.status == 200) {
        setAssignmentReferences(parsedAssignments.referencesFiles);
        setRole(parsedAssignments.role);
        setAssignmentInfo(parsedAssignments.data);
        setAssignmentMeta(parsedAssignments);
        console.log(parsedAssignments);
        if (parsedAssignments.submitted) {
          setIsProcessing(true);
        }
      } else if ((parsedAssignments.status = 404)) {
        setAssignmentInfo([]);
        console.log("No assignments found");
      } else {
        setAssignmentInfo([]);
        console.log("Error fetching assignments");
      }
    };

    fetchData();
  }, []);

  const handleFileChange: ChangeEventHandler<HTMLInputElement> = (e) => {
    e.preventDefault();
    setFiles(e.target.files);
  };

  const handleSubmitAssignment = async () => {
    setIsProcessing(true);
    try {
      const formData = new FormData();
      formData.append("assignmentId", params.id);
      if (files) {
        Array.from(files).forEach((file, index) => {
          formData.append(`files[${index}]`, file);
        });
      }

      const response = await fetch("/api/submit-assignment", {
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

  const assignmentDetail = async (assignmentId: number) => {
    setDialogOpen(true);
    let assignmentDetail = await getAssignmentSubmissionInformation(
      params.id,
      assignmentId
    );
    console.log(assignmentDetail);

    let parsedAssignmentDetail = JSON.parse(assignmentDetail as string);
    // TODO: Show the assignment detail in a modal
    setDialogAssignmentMeta(parsedAssignmentDetail);
    setDialogTitle("Submission detail of " + parsedAssignmentDetail.data.name);
    if (parsedAssignmentDetail.data.grade == null) {
      setDialogDescription(
        "Ungraded, submitted at " +
          new Date(parsedAssignmentDetail.data.submitted_at).toLocaleString()
      );
    } else {
      setDialogDescription(
        "Grade: " +
          parsedAssignmentDetail.data.grade +
          "/" +
          assignmentInfo.assignments.possible_marks +
          ", submitted at " +
          new Date(parsedAssignmentDetail.data.submitted_at).toLocaleString()
      );
    }
    setDialogAssignmentSubmittedFiles(parsedAssignmentDetail.referenceFiles);
  };

  const handleSubmitForm = async (event: React.FormEvent) => {
    try {
      event.preventDefault();
      setDialogIsProcessing(true);
      // Perform form submission logic here
      // For example, make an API call to submit the form data
      const submitResponse = await gradeAssignment(
        dialogAssignmentMeta.data.submission_id,
        Number(grade)
      );
      const parsedSubmitResponse = JSON.parse(submitResponse as string);
      console.log(parsedSubmitResponse);
      setDialogIsProcessing(false);
      if (parsedSubmitResponse.status == 200) {
        setDialogOpen(false);
      } else {
        setDialogIsProcessing(false);
      }
    } catch (error) {
      setDialogIsProcessing(false);
      setError("Failed to submit form. Please try again.");
    }
  };

  if (assignmentInfo == null) {
    return (
      <div>
        <h1>Loading Assignment...</h1>
      </div>
    );
  }
  return (
    <div>
      <div className="flex justify-between items-center mb-4">
        <h1 className="text-xl font-bold">Assignment</h1>
        {role === "Student" && (
          <Button
            variant="default"
            onClick={handleSubmitAssignment}
            disabled={isProcessing}
          >
            {isSubmitted ? (
              isProcessing ? (
                <span>Turning In</span>
              ) : (
                <span>Turn In</span>
              )
            ) : (
              "Turned In"
            )}
          </Button>
        )}
      </div>
      <section>
        <div className="grid gap-y-3">
          <div className="flex justify-between items-center">
            <div>
              <h3 className="text-xl font-semibold mt-4">
                {assignmentInfo.assignments.name}
              </h3>
              <p className="text-sm text-gray-600">
                Due at{" "}
                {new Date(assignmentInfo.assignments.due_at)?.toLocaleString()}
              </p>
              <p className="text-sm text-gray-600">
                {assignmentInfo.assignments.description}
              </p>
            </div>
            <div className="flex items-center mt-4">
              <p>
                {assignmentInfo.assignments.possible_marks == 0
                  ? "Ungraded"
                  : assignmentInfo.assignments.possible_marks + " Marks"}
              </p>
            </div>
          </div>
          <Dialog
            open={dialogOpen}
            onOpenChange={() => setDialogOpen(!dialogOpen)}
          >
            <DialogContent>
              <DialogHeader>
                <DialogTitle>{dialogTitle}</DialogTitle>
                <DialogDescription>
                  {dialogDescription}
                  <br />
                  <br />
                  <p className="mb-2">Submitted Files</p>
                  {dialogAssignmentSubmittedFiles.map((file: any) => (
                    <a href={file.url} key={file.url} target="_blank">
                      <div className="border border-gray-300 hover:bg-gray-100 rounded cursor-pointer">
                        <p className="flex p-2 text-sm">
                          <FileTextIcon className="h-full mr-2" />
                          {file.fileName}
                        </p>
                      </div>
                    </a>
                  ))}

                  {dialogAssignmentMeta.data?.grade !== undefined &&
                    dialogAssignmentMeta.data?.grade === null &&
                    dialogAssignmentMeta.possible_marks !== 0 && (
                      <div>
                        <br />
                        <form onSubmit={handleSubmitForm}>
                          <div className="flex w-full max-w-sm items-center space-x-2 mt-2">
                            <Label htmlFor="grade">Grade</Label>
                            <Input
                              type="number"
                              placeholder="Grade"
                              value={grade}
                              onChange={(e) => setGrade(e.target.value)}
                              max={dialogAssignmentMeta.possible_marks}
                              min={0}
                              required
                            />
                            <Button type="submit" disabled={dialogIsProcessing}>
                              Submit
                            </Button>
                            <p className="text-sm">
                              {"Max: " + dialogAssignmentMeta.possible_marks}
                            </p>
                          </div>
                        </form>
                      </div>
                    )}
                </DialogDescription>
              </DialogHeader>
            </DialogContent>
          </Dialog>
          {assignmentReferences.length > 0 && (
            <h4 className="text-sm mt-4 text-gray-600">Reference Materials</h4>
          )}
          {assignmentReferences.map((file: any) => (
            <a href={file.url} key={file.url} target="_blank">
              <div className="border border-gray-300 hover:bg-gray-100 rounded cursor-pointer md:w-1/2">
                <p className="flex p-2 text-sm">
                  <FileTextIcon className="h-full mr-2" />
                  {file.fileName}
                </p>
              </div>
            </a>
          ))}
          {assignmentMeta.submitted === true && (
            <div className="grid w-full items-center gap-3 mt-2 ">
              <h4 className="text-sm mt-4 text-gray-600">Submission Files</h4>
              {assignmentMeta.submittedFiles.map((submission: any) => {
                return (
                  <Link href={submission.url} key={submission.url}>
                    <div className="border border-gray-300 hover:bg-gray-100 rounded cursor-pointer md:w-1/2">
                      <p className="flex p-2 text-sm">
                        <FileTextIcon className="h-full mr-2" />
                        {submission.fileName}
                      </p>
                    </div>
                  </Link>
                );
              })}
            </div>
          )}

          {assignmentMeta.submitted === false && role === "Student" && (
            <div className="grid w-full items-center gap-3 mt-2 md:w-1/2">
              <Label htmlFor="attach">Submission Files</Label>
              <Input
                type="file"
                id="attach"
                name="attach"
                onChange={handleFileChange}
                multiple
              />
            </div>
          )}
          {error && (
            <p className="text-sm text-red-500 mb-2 font-semibold">{error}</p>
          )}
          {role === "Instructor" && (
            <Tabs defaultValue="ready-to-grade" className="w-auto">
              <TabsList>
                <TabsTrigger value="ready-to-grade">Ready to Grade</TabsTrigger>
                {assignmentInfo.assignments.possible_marks !== 0 && (
                  <TabsTrigger value="graded">Graded</TabsTrigger>
                )}
              </TabsList>
              <TabsContent value="ready-to-grade">
                <Table className="mt-2">
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-[100px]">Submission ID</TableHead>
                      <TableHead>Student Name</TableHead>
                      <TableHead>Submitted At</TableHead>
                      <TableHead className="text-right">Action</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {assignmentMeta.submissions.map((submission: any) => {
                      if (submission.assignment_submissions.grade !== null) {
                        return;
                      }
                      return (
                        <TableRow key={submission.assignment_submissions.id}>
                          <TableCell
                            className="font-medium"
                            key={submission.assignment_submissions.id}
                          >
                            {submission.assignment_submissions.id}
                          </TableCell>
                          <TableCell>{submission.users.name}</TableCell>
                          <TableCell>
                            {new Date(
                              submission.assignment_submissions.submitted_at
                            ).toLocaleString()}
                          </TableCell>
                          <TableCell className="text-right">
                            <Button
                              onClick={() => {
                                assignmentDetail(
                                  submission.assignment_submissions.id
                                );
                                setDialogAssignmentSubmittedFiles([]);
                              }}
                            >
                              Detail
                            </Button>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </TabsContent>
              <TabsContent value="graded">
                <Table className="mt-2">
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-[100px]">Submission ID</TableHead>
                      <TableHead>Student Name</TableHead>
                      <TableHead>Given Mark</TableHead>
                      <TableHead className="text-right">Action</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {assignmentMeta.submissions.map((submission: any) => {
                      if (submission.assignment_submissions.grade == null) {
                        return;
                      } else {
                        return (
                          <TableRow key={submission.assignment_submissions.id}>
                            <TableCell className="font-medium">
                              {submission.assignment_submissions.id}
                            </TableCell>
                            <TableCell>{submission.users.name}</TableCell>
                            <TableCell>
                              {submission.assignment_submissions.grade +
                                "/" +
                                assignmentInfo.assignments.possible_marks}
                            </TableCell>
                            <TableCell className="text-right">
                              <Button
                                onClick={() => {
                                  assignmentDetail(
                                    submission.assignment_submissions.id
                                  );
                                  setDialogAssignmentSubmittedFiles([]);
                                }}
                              >
                                Detail
                              </Button>
                            </TableCell>
                          </TableRow>
                        );
                      }
                    })}
                  </TableBody>
                </Table>
              </TabsContent>
            </Tabs>
          )}
        </div>
      </section>
    </div>
  );
}
