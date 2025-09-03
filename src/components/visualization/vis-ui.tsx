"use client";

import React, { useState, useEffect } from "react";
import dynamic from "next/dynamic";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { motion } from "framer-motion";
import axios from "axios";

const ClusterVisualization = dynamic(
  () => import("@/components/visualization"),
  { ssr: false }
);

interface RepnessItem {
  tid: number;
  "p-test": number;
  repness: number;
  "n-trials": number;
  "n-success": number;
  "p-success": number;
  "repful-for": string;
  "repness-test": number;
  "best-agree"?: boolean;
}

interface ConsensusItem {
  tid: number;
  "p-test": number;
  "n-trials": number;
  "n-success": number;
  "p-success": number;
}

export default function VisUi({ zid }: { zid: string }) {
  const [selectedCluster, setSelectedCluster] = useState<number | null>(null);
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [currentUserId, setCurrentUserId] = useState<number | null>(null);
  const [carouselIndex, setCarouselIndex] = useState(0);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    axios.get(`/api/v1/math/${zid}`)
      .then((res) => {
        setData(res.data);
        setLoading(false);
      })
      .catch((err) => {
        console.error("Error fetching math data:", err);
        if (err.response?.status === 404) {
          setError("No data found for conversation ID 1. Please ensure there is math data available for this conversation.");
        } else {
          setError("Failed to load visualization data. Please try again later.");
        }
        setLoading(false);
      });
  }, [zid]);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const uid = localStorage.getItem('uid');
      setCurrentUserId(uid ? Number(uid) : null);
    }
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="flex flex-col items-center space-y-4">
          <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" />
          <p className="text-lg text-gray-600">Loading visualization data...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center space-y-4">
          <div className="text-6xl">⚠️</div>
          <h2 className="text-2xl font-semibold text-gray-800">
            No Data Available
          </h2>
          <p className="text-gray-600 max-w-md mx-auto">
            {error}
          </p>
          <p className="text-sm text-gray-500 mt-4">
            To see visualization data, you need to have a conversation with ID 1 that contains math analysis data.
          </p>
        </div>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center space-y-4">
          <div className="text-6xl">⚠️</div>
          <h2 className="text-2xl font-semibold text-gray-800">
            No Data Available
          </h2>
          <p className="text-gray-600">
            Unable to load visualization data. Please try again later.
          </p>
        </div>
      </div>
    );
  }

  const commentsData = data.commentsData;
  const usersData = data.usersData;
  const math = data.mathData[0]?.data;

  const getComment = (tid: number) =>
    commentsData.find((c: any) => c.tid === tid);
  const getUser = (uid: number) => usersData.find((u: any) => u.uid === uid);

  const repness = (math?.repness as Record<string, any[]>) || {};
  const groupClustersRaw = (math?.["group-clusters"] as any[]) || [];
  const consensus = (math?.consensus as { agree: any[], disagree: any[] }) || { agree: [], disagree: [] };
  const commentPriorities = (math?.["comment-priorities"] as Record<string, number>) || {};
  const sortedPriorities = Object.entries(commentPriorities)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 3);

  const usersIdList = usersData?.map((u: any) => u.uid) || [];

  const groupClusters = groupClustersRaw.map((cluster: any) => ({
    ...cluster,
    members: cluster.members || []
  }));

  const baseClusters = {
    ...(math?.["base-clusters"] as any),
    id: (math?.["base-clusters"] as any)?.id
  };

  // Find the cluster index for the current user
  const userClusterIndex = currentUserId !== null
    ? groupClusters.findIndex((cluster: any) => cluster.members.includes(currentUserId))
    : -1;

  // Top 3 agreed and disagreed comments from consensus
  const topAgreed = (consensus?.agree || []).slice(0, 3).map((item: any) => ({
    ...item,
    label: 'Top Agreed',
    comment: getComment(item.tid),
    score: (item["p-success"] ?? 0) * 100
  }));
  const topDisagreed = (consensus?.disagree || []).slice(0, 3).map((item: any) => ({
    ...item,
    label: 'Top Disagreed',
    comment: getComment(item.tid),
    score: (item["p-success"] ?? 0) * 100
  }));
  // Top 3 by priority
  const topPriority = sortedPriorities.map(([tid, score], index) => {
    const comment = getComment(Number(tid));
    // Find stats for this comment from consensus.agree, consensus.disagree, or repness
    let stats = null;
    if (consensus && consensus.agree) {
      stats = consensus.agree.find((c: any) => c.tid === Number(tid));
    }
    if (!stats && consensus && consensus.disagree) {
      stats = consensus.disagree.find((c: any) => c.tid === Number(tid));
    }
    // Try repness as fallback
    if (!stats && repness) {
      for (const key in repness) {
        const found = (repness[key] || []).find((r: any) => r.tid === Number(tid));
        if (found) stats = found;
      }
    }
    return { tid, score, comment, stats, label: 'Top Priority' };
  });
  // Combine all for carousel
  const topComments = [
    ...topAgreed,
    ...topDisagreed,
    ...topPriority
  ];

  return (
    <main className="mx-auto p-6">
      
      {currentUserId !== null && (
        <div className="mb-4 text-lg font-semibold text-blue-700">
          {userClusterIndex !== -1
            ? `You belong to Cluster ${userClusterIndex + 1}`
            : 'You do not belong to any cluster.'}
        </div>
      )}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
            Data Visualization
          </h1>
          <p className="text-gray-600 mt-2">
            Interactive analysis of conversation clusters and patterns
          </p>
        </div>
        <div className="flex items-center space-x-4">
          <Badge variant="outline" className="px-4 py-2">
            {math.n} Users
          </Badge>
          <Badge variant="outline" className="px-4 py-2">
            {math["n-cmts"]} Comments
          </Badge>
        </div>
      </div>

      <Tabs defaultValue="clusters" className="space-y-6">
        <TabsList className="grid w-full grid-cols-3 lg:w-[400px]">
          <TabsTrigger
            value="clusters"
            className="data-[state=active]:bg-blue-500 data-[state=active]:text-white"
          >
            Cluster Analysis
          </TabsTrigger>
          <TabsTrigger
            value="statistics"
            className="data-[state=active]:bg-blue-500 data-[state=active]:text-white"
          >
            Statistics
          </TabsTrigger>
          <TabsTrigger
            value="insights"
            className="data-[state=active]:bg-blue-500 data-[state=active]:text-white"
          >
            Key Insights
          </TabsTrigger>
        </TabsList>

        <TabsContent value="clusters" className="">
          <div className="gap-6">
              <ClusterVisualization
                onClusterSelect={setSelectedCluster}
                groupClusters={groupClusters}
                baseClusters={baseClusters}
                currentUserId={currentUserId}
              />

            <div className="space-y-6">
              {selectedCluster !== null && (
                <Card>
                  <CardHeader>
                    <CardTitle>Selected Cluster Details</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div>
                        <h4 className="text-sm font-medium mb-2">Members</h4>
                        <div className="space-y-2">
                          {groupClusters[selectedCluster].members.map(
                            (memberId: number) => {
                              const user = getUser(memberId);
                              return (
                                <div
                                  key={memberId}
                                  className="flex items-center space-x-2 p-2 bg-gray-50 rounded"
                                >
                                  <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center">
                                    {user?.hname?.charAt(0)}
                                  </div>
                                  <span className="text-sm">{user?.hname}</span>
                                </div>
                              );
                            }
                          )}
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>

            {/* Top Comments Carousel */}
            <div className="mt-8">
              <h3 className="text-lg font-semibold mb-4 text-gray-700">Top Comments</h3>
              {topComments.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  No comments available for visualization
                </div>
              ) : (
                <>
                  <div className="flex items-center justify-center space-x-4">
                    <button
                      className="rounded-full bg-gray-200 p-2 text-xl font-bold text-gray-600 hover:bg-gray-300 disabled:opacity-40"
                      onClick={() => setCarouselIndex((i) => Math.max(0, i - 1))}
                      disabled={carouselIndex === 0}
                      aria-label="Previous"
                    >
                      &#8592;
                    </button>
                    <div className="w-[340px] max-w-xs bg-blue-50 rounded-xl shadow p-5 flex flex-col justify-between border border-blue-100 transition-all duration-300">
                      <div className="flex items-center mb-2">
                        <span className={`px-2 py-1 rounded text-xs font-bold mr-2 ${topComments[carouselIndex]?.label === 'Top Agreed' ? 'bg-green-200 text-green-800' : topComments[carouselIndex]?.label === 'Top Disagreed' ? 'bg-red-200 text-red-800' : 'bg-yellow-200 text-yellow-800'}`}>{topComments[carouselIndex]?.label || 'Unknown'}</span>
                      </div>
                      <div className="flex items-center mb-2">
                        <div className="w-8 h-8 rounded-full bg-blue-200 flex items-center justify-center text-lg font-bold text-blue-700 mr-3">
                          {carouselIndex + 1}
                        </div>
                        <span className="text-xs text-gray-400">Score</span>
                        <span className="ml-2 px-3 py-1 rounded bg-yellow-200 text-yellow-800 font-bold text-sm">
                          {topComments[carouselIndex]?.score ? topComments[carouselIndex].score.toFixed(1) + '%' : ''}
                        </span>
                      </div>
                      <div className="text-gray-700 text-base font-medium mb-2 whitespace-pre-line">
                        {topComments[carouselIndex]?.comment?.txt || 'No comment text available'}
                      </div>
                      {topComments[carouselIndex]?.stats && (
                        <div className="mt-2 space-y-1 text-xs text-gray-700">
                          {typeof topComments[carouselIndex].stats["p-success"] !== 'undefined' && (
                            <div>Success %: <span className="font-bold">{(topComments[carouselIndex].stats["p-success"] * 100).toFixed(1)}%</span></div>
                          )}
                          {typeof topComments[carouselIndex].stats["n-trials"] !== 'undefined' && (
                            <div>Trials: <span className="font-bold">{topComments[carouselIndex].stats["n-trials"]}</span></div>
                          )}
                          {typeof topComments[carouselIndex].stats["n-success"] !== 'undefined' && (
                            <div>Successes: <span className="font-bold">{topComments[carouselIndex].stats["n-success"]}</span></div>
                          )}
                          {typeof topComments[carouselIndex].stats["p-test"] !== 'undefined' && (
                            <div>p-test: <span className="font-bold">{topComments[carouselIndex].stats["p-test"].toFixed(3)}</span></div>
                          )}
                          {typeof topComments[carouselIndex].stats["repness"] !== 'undefined' && (
                            <div>Repness: <span className="font-bold">{topComments[carouselIndex].stats["repness"].toFixed(2)}</span></div>
                          )}
                          {/* Add more stats as needed */}
                        </div>
                      )}
                    </div>
                    <button
                      className="rounded-full bg-gray-200 p-2 text-xl font-bold text-gray-600 hover:bg-gray-300 disabled:opacity-40"
                      onClick={() => setCarouselIndex((i) => Math.min(topComments.length - 1, i + 1))}
                      disabled={carouselIndex === topComments.length - 1}
                      aria-label="Next"
                    >
                      &#8594;
                    </button>
                  </div>
                  <div className="flex justify-center mt-2 space-x-1">
                    {topComments.map((_, i) => (
                      <button
                        key={i}
                        className={`w-2 h-2 rounded-full ${i === carouselIndex ? 'bg-blue-500' : 'bg-gray-300'}`}
                        onClick={() => setCarouselIndex(i)}
                        aria-label={`Go to comment ${i + 1}`}
                      />
                    ))}
                  </div>
                </>
              )}
            </div>
          </div>
        </TabsContent>

        <TabsContent value="statistics" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Voting Overview</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  <div>
                    <h4 className="text-sm font-medium mb-2">Total Votes</h4>
                    <div className="flex items-center justify-between">
                      <span className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                        {Object.values(
                          (math?.["user-vote-counts"] as Record<string, number>) || {}
                        ).reduce((a: number, b: number) => a + b, 0)}
                      </span>
                      <Badge variant="secondary">Across {math?.n || 0} users</Badge>
                    </div>
                  </div>
                  <div>
                    <h4 className="text-sm font-medium mb-2">
                      Vote Distribution
                    </h4>
                    <div className="space-y-4">
                      <div>
                        <div className="flex justify-between text-sm mb-1">
                          <span>Agree</span>
                          <span>45%</span>
                        </div>
                        <Progress value={45} className="h-2 bg-blue-100" />
                      </div>
                      <div>
                        <div className="flex justify-between text-sm mb-1">
                          <span>Disagree</span>
                          <span>35%</span>
                        </div>
                        <Progress value={35} className="h-2 bg-red-100" />
                      </div>
                      <div>
                        <div className="flex justify-between text-sm mb-1">
                          <span>Skip</span>
                          <span>20%</span>
                        </div>
                        <Progress value={20} className="h-2 bg-gray-100" />
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Cluster Stats</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  <div>
                    <h4 className="text-sm font-medium mb-2">
                      Cluster Distribution
                    </h4>
                    <div className="space-y-4">
                      {groupClusters.map(
                        (cluster: any, index: number) => (
                          <div key={index}>
                            <div className="flex justify-between text-sm mb-1">
                              <span>Cluster {index + 1}</span>
                              <span>{cluster.members.length} members</span>
                            </div>
                            <Progress
                              value={(cluster.members.length / (math?.n || 1)) * 100}
                              className={`h-2 ${
                                index === 0 ? "bg-blue-100" : "bg-green-100"
                              }`}
                            />
                          </div>
                        )
                      )}
                    </div>
                  </div>
                  <div>
                    <h4 className="text-sm font-medium mb-2">
                      Average Repness
                    </h4>
                    <div className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                      {(
                        [...repness["0"] || [], ...repness["1"] || []].reduce(
                          (acc, curr) => acc + curr.repness,
                          0
                        ) /
                        (repness["0"]?.length || 0 + repness["1"]?.length || 0)
                      ).toFixed(1)}
                    </div>
                    <p className="text-sm text-gray-600">Across all clusters</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Comment Stats</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  <div>
                    <h4 className="text-sm font-medium mb-2">Total Comments</h4>
                    <div className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                      {math?.["n-cmts"] || 0}
                    </div>
                    <p className="text-sm text-gray-600">Across all clusters</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="insights" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Representative Comments</CardTitle>
              </CardHeader>
              <CardContent>
                <ScrollArea className="h-[600px]">
                  <div className="space-y-6">
                    {groupClusters.map((cluster: any, index: number) => (
                      <div key={cluster.id} className="space-y-4">
                        <h4 className={`font-medium ${index === 0 ? "text-blue-600" : "text-green-600"}`}>
                          Cluster {cluster.id + 1} ({cluster.members.length} members)
                        </h4>
                        <div className="space-y-4">
                          {(repness[cluster.id] || []).map((r: any) => {
                            const comment = getComment(r.tid);
                            return (
                              <motion.div
                                key={r.tid}
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                className={`p-4 ${index === 0 ? "bg-blue-50 border-blue-100" : "bg-green-50 border-green-100"} rounded-lg border`}
                              >
                                <div className="flex justify-between items-start">
                                  <Badge variant="secondary">
                                    p={r["p-success"]?.toFixed(2)}
                                  </Badge>
                                </div>
                                <p className="text-sm text-gray-600 mt-2">
                                  {comment?.txt}
                                </p>
                                <div className="mt-3 flex items-center space-x-4 text-sm text-gray-500">
                                  <span>Repness: {r.repness.toFixed(1)}</span>
                                  <span>Trials: {r["n-trials"]}</span>
                                  <span>Success: {r["n-success"]}</span>
                                  {r["best-agree"] && (
                                    <Badge variant="outline" className="bg-green-100">
                                      Best Agreement
                                    </Badge>
                                  )}
                                </div>
                              </motion.div>
                            );
                          })}
                        </div>
                      </div>
                    ))}
                  </div>
                </ScrollArea>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Consensus Points</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  <div className="p-4 bg-green-50 rounded-lg border border-green-100">
                    <h4 className="font-medium text-green-800 mb-4">
                      Agreement Points
                    </h4>
                    <div className="space-y-4">
                      {consensus.agree.map((c: any) => {
                        const comment = getComment(c.tid);
                        return (
                          <motion.div
                            key={c.tid}
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            className="flex items-center justify-between p-3 bg-white rounded-lg border border-green-200"
                          >
                            <div className="space-y-1">
                              {comment && (
                                <p className="text-sm text-gray-600">
                                  {comment.txt}
                                </p>
                              )}
                            </div>
                            <div className="flex items-center space-x-2">
                              <Badge variant="secondary">
                                p={c["p-success"]?.toFixed(2)}
                              </Badge>
                              <Badge>{c["n-trials"]} trials</Badge>
                            </div>
                          </motion.div>
                        );
                      })}
                    </div>
                  </div>

                  <div className="p-4 bg-red-50 rounded-lg border border-red-100">
                    <h4 className="font-medium text-red-800 mb-4">
                      Disagreement Points
                    </h4>
                    {consensus.disagree.length === 0 ? (
                      <p className="text-sm text-red-600">
                        No significant disagreement points found
                      </p>
                    ) : (
                      <div className="space-y-4">
                        {consensus.disagree.map((c: any) => {
                          const comment = getComment(c.tid);
                          return (
                            <motion.div
                              key={c.tid}
                              initial={{ opacity: 0, x: -20 }}
                              animate={{ opacity: 1, x: 0 }}
                              className="flex items-center justify-between p-3 bg-white rounded-lg border border-red-200"
                            >
                              <div className="space-y-1">
                                {comment && (
                                  <p className="text-sm text-gray-600">
                                    {comment.txt}
                                  </p>
                                )}
                              </div>
                              <div className="flex items-center space-x-2">
                                <Badge variant="secondary">
                                  p={c["p-success"]?.toFixed(2)}
                                </Badge>
                                <Badge>{c["n-trials"]} trials</Badge>
                              </div>
                            </motion.div>
                          );
                        })}
                      </div>
                    )}
                  </div>

                  <div className="p-4 bg-gray-50 rounded-lg border border-gray-200">
                    <h4 className="font-medium mb-4">Comment Priorities</h4>
                    <div className="space-y-4">
                      {(sortedPriorities as [string, number][]).map(
                        ([tid, score]: [string, number], index: number) => {
                          const comment = getComment(Number(tid));
                          return (
                            <motion.div
                              key={tid}
                              initial={{ opacity: 0, y: 20 }}
                              animate={{ opacity: 1, y: 0 }}
                              transition={{ delay: index * 0.1 }}
                              className="space-y-2"
                            >
                              <div className="flex items-center justify-between">
                                <div className="space-y-1">
                                  {comment && (
                                    <p className="text-xs text-gray-500 truncate max-w-[200px]">
                                      {comment.txt}
                                    </p>
                                  )}
                                </div>
                                <Badge variant="secondary">
                                  {score.toFixed(1)}
                                </Badge>
                              </div>
                              <div className="w-full bg-gray-200 rounded-full h-2">
                                <div
                                  className="bg-gradient-to-r from-blue-500 to-purple-500 h-2 rounded-full transition-all duration-500"
                                  style={{
                                    width: `${Math.min(
                                      100,
                                      (score / (sortedPriorities[0]?.[1] as number || 1)) * 100
                                    )}%`,
                                  }}
                                />
                              </div>
                            </motion.div>
                          );
                        }
                      )}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </main>
  );
}
