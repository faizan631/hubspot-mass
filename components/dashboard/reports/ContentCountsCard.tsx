// components/dashboard/reports/ContentCountsCard.tsx
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { RefreshCw, Filter } from "lucide-react";

// Static data can live here for now
const contentData = [
  {
    type: "Landing Page",
    language: "en-us",
    domain: "main-site.com",
    count: 142,
  },
  {
    type: "Website Page",
    language: "en-us",
    domain: "main-site.com",
    count: 310,
  },
  {
    type: "Blog Post",
    language: "en-us",
    domain: "blog.main-site.com",
    count: 78,
  },
  {
    type: "Knowledge Article",
    language: "en-us",
    domain: "help.main-site.com",
    count: 256,
  },
  { type: "Marketing Email", language: "All", domain: "N/A", count: 94 },
];

export const ContentCountsCard = () => {
  return (
    <Card className="overflow-hidden">
      <CardHeader className="flex flex-row items-center justify-between border-b bg-white/50">
        <div>
          <CardTitle>Live Content Counts</CardTitle>
          <CardDescription className="mt-1">
            A real-time overview of your content assets in HubSpot.
          </CardDescription>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm">
            <Filter className="mr-2 h-4 w-4" />
            Filter
          </Button>
          <Button size="sm">
            <RefreshCw className="mr-2 h-4 w-4" />
            Refresh Data
          </Button>
        </div>
      </CardHeader>
      <CardContent className="p-0">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="font-semibold">Content Type</TableHead>
              <TableHead className="font-semibold">Language</TableHead>
              <TableHead className="font-semibold">Domain</TableHead>
              <TableHead className="text-right font-semibold">
                Total Items
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {contentData.map((item) => (
              <TableRow key={item.type}>
                <TableCell className="font-medium">{item.type}</TableCell>
                <TableCell>{item.language}</TableCell>
                <TableCell>{item.domain}</TableCell>
                <TableCell className="text-right">
                  <a
                    href="#"
                    className="text-indigo-600 hover:underline font-medium"
                  >
                    {item.count}
                  </a>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
};
