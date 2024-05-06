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
import { getAssignments } from "../lib/function";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { hasCookie } from "cookies-next";
import { useRouter } from "next/navigation";

export default function Component() {
  const [isOpen, setIsOpen] = useState(false);
  const [assignments, setAssignments] = useState<any>([]);
  const router = useRouter();

  useEffect(() => {
    if (!hasCookie("jwt")) {
      router.push("/auth/login");
    }

    const fetchData = async () => {
      const assignments = await getAssignments();
      const parsedAssignments = JSON.parse(assignments as string);
      if (parsedAssignments.status == 200) {
        setAssignments(parsedAssignments.data);
        console.log(parsedAssignments.data);
      } else if ((parsedAssignments.status = 404)) {
        setAssignments([]);
        console.log("No assignments found");
      } else {
        setAssignments([]);
        console.log("Error fetching assignments");
      }
    };

    fetchData();
  }, []);
  return (
    <div>
      <div className="flex justify-between items-center mb-4">
        <h1 className="text-xl font-bold">Assignment</h1>
        <Link href="/assignment/create">
          <Button variant="default">Create Assignment</Button>
        </Link>
      </div>
      <section>
        <Tabs defaultValue="upcoming" className="mb-2">
          <TabsList>
            <TabsTrigger value="upcoming">Upcoming</TabsTrigger>
            <TabsTrigger value="past">Past</TabsTrigger>
          </TabsList>
          <TabsContent value="upcoming" className="mb-2">
            <div className="grid gap-y-3">
              {assignments.map((assignment: any) => {
                if (new Date(assignment.assignments.due_at) > new Date()) {
                  return (
                    <Link
                      href={"/assignment/" + String(assignment.assignments.id)}
                      key={assignment.assignments.id}
                    >
                      <Card className="w-full hover:shadow-md">
                        <CardContent>
                          <div className="flex justify-between items-center">
                            <div>
                              <h3 className="text-md font-semibold mt-4">
                                {assignment.assignments.name}
                              </h3>
                              <p className="text-sm text-gray-600">
                                Due at{" "}
                                {new Date(
                                  assignment.assignments?.due_at
                                )?.toLocaleString()}
                              </p>
                              <p className="text-sm text-gray-600">
                                {assignment.classrooms.name}
                              </p>
                            </div>
                            <div className="flex items-center mt-4">
                              <p>
                                {assignment.assignments.possible_marks == 0
                                  ? "Ungraded"
                                  : assignment.assignments.possible_marks +
                                    " Marks"}
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
                if (new Date(assignment.assignments.due_at) < new Date()) {
                  return (
                    <Link
                      href={"/assignment/" + String(assignment.assignments.id)}
                      key={assignment.assignments.id}
                    >
                      <Card className="w-full hover:shadow-md">
                        <CardContent>
                          <div className="flex justify-between items-center">
                            <div>
                              <h3 className="text-md font-semibold mt-4">
                                {assignment.assignments.name}
                              </h3>
                              <p className="text-sm text-gray-600">
                                Due at{" "}
                                {new Date(
                                  assignment.assignments?.due_at
                                )?.toLocaleString()}
                              </p>
                              <p className="text-sm text-gray-600">
                                {assignment.classrooms.name}
                              </p>
                            </div>
                            <div className="flex items-center mt-4">
                              <p>
                                {assignment.assignments.possible_marks == 0
                                  ? "Ungraded"
                                  : assignment.assignments.possible_marks +
                                    " Marks"}
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
      </section>
    </div>
  );
}
