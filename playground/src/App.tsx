import type { ValidatorInput } from "@idoa/core";
import { detectKind } from "@idoa/validator";
import CloudDownloadRounded from "@mui/icons-material/CloudDownloadRounded";
import ContentCopyRounded from "@mui/icons-material/ContentCopyRounded";
import PlayArrowRounded from "@mui/icons-material/PlayArrowRounded";
import {
  Alert,
  Box,
  Button,
  Chip,
  Container,
  FormControl,
  MenuItem,
  Paper,
  Select,
  Stack,
  Tab,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  Tabs,
  TextField,
  Typography,
} from "@mui/material";
import type { SelectChangeEvent } from "@mui/material/Select";
import React, { useState, type ChangeEvent, type SyntheticEvent } from "react";
import {
  type PlaygroundMessageRow,
  flattenMessages,
  parseUploadedReport,
  reportToDownload,
  validateBrowserInput,
} from "./lib/browser.js";
import { fixtureOptions, invalidSample, validSample } from "./lib/samples.js";

type AppTab = "validate" | "fixtures" | "report";
type PlaygroundInputKind = Extract<
  ValidatorInput["kind"],
  "transaction-payload" | "entry-function-call" | "generic-json"
>;

export function App() {
  const [tab, setTab] = useState<AppTab>("validate");
  const [inputType, setInputType] = useState<PlaygroundInputKind>(
    "transaction-payload",
  );
  const [jsonInput, setJsonInput] = useState(
    JSON.stringify(validSample, null, 2),
  );
  const [fixtureId, setFixtureId] = useState(
    fixtureOptions[0]?.id ?? "valid-transfer",
  );
  const [messages, setMessages] = useState<PlaygroundMessageRow[]>([]);
  const [reportText, setReportText] = useState("");
  const [summary, setSummary] = useState({
    total: 0,
    pass: 0,
    fail: 0,
    warning: 0,
  });
  const [topFailures, setTopFailures] = useState<string[]>([]);
  const modeInfo =
    "Offline mode runs deterministic local checks. Online mode is available when the optional server is running.";
  const selectedFixture =
    fixtureOptions.find((fixture) => fixture.id === fixtureId) ??
    fixtureOptions[0];
  const selectMenuProps = {
    PaperProps: {
      sx: {
        mt: 1,
        border: "1px solid rgba(22, 50, 79, 0.14)",
        backgroundColor: "#fffaf2",
        backgroundImage: "none",
        boxShadow: "0 18px 40px rgba(22, 50, 79, 0.14)",
      },
    },
    MenuListProps: {
      sx: {
        py: 0.5,
      },
    },
  } as const;

  async function handleValidate(
    raw: string,
    kindOverride?: PlaygroundInputKind,
  ) {
    try {
      const parsed = JSON.parse(raw) as unknown;
      const detectedKind = detectKind("inline.json", parsed);
      const kind: PlaygroundInputKind =
        kindOverride ??
        (detectedKind === "move-package" || detectedKind === "network-config"
          ? "generic-json"
          : detectedKind);
      const { validation, report } = await validateBrowserInput({
        kind,
        source: "playground-input",
        data: parsed,
      });
      setMessages(flattenMessages(validation.results));
      setReportText(reportToDownload(report));
      setSummary(report.summary);
      setTopFailures(
        report.details[0]?.results
          .filter((result) => result.status !== "pass")
          .map((result) => `${result.ruleId}:${result.status}`) ?? [],
      );
    } catch {
      setMessages([
        {
          ruleId: "playground.input",
          severity: "error",
          message: "Input is not valid JSON.",
        },
      ]);
      setReportText("");
      setSummary({ total: 0, pass: 0, fail: 0, warning: 0 });
      setTopFailures(["playground.input:error"]);
    }
  }

  function downloadReport() {
    if (!reportText) {
      return;
    }
    const blob = new Blob([reportText], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = "report.json";
    anchor.click();
    URL.revokeObjectURL(url);
  }

  async function handleReportUpload(file: File | null) {
    if (!file) {
      return;
    }
    const content = await file.text();
    const report = parseUploadedReport(content);
    setSummary(report.summary);
    setTopFailures(
      report.details
        .filter((detail) => detail.status === "fail")
        .map(
          (detail) =>
            `${detail.target}:${detail.results.find((result) => result.status === "fail")?.ruleId ?? "unknown"}`,
        ),
    );
    setReportText(content);
    setMessages(
      flattenMessages(report.details.flatMap((detail) => detail.results)),
    );
  }

  function handleTabChange(_event: SyntheticEvent, value: AppTab) {
    setTab(value);
  }

  function handleInputTypeChange(
    event: SelectChangeEvent<PlaygroundInputKind>,
  ) {
    setInputType(event.target.value as PlaygroundInputKind);
  }

  function handleFixtureChange(event: SelectChangeEvent<string>) {
    setFixtureId(event.target.value);
  }

  function handleJsonInputChange(
    event: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>,
  ) {
    setJsonInput(event.target.value);
  }

  function handleReportFileChange(event: ChangeEvent<HTMLInputElement>) {
    void handleReportUpload(event.target.files?.[0] ?? null);
  }

  return (
    <Container maxWidth="lg" sx={{ py: { xs: 3, md: 5 } }}>
      <Stack spacing={3}>
        <Box sx={{ py: 2 }}>
          <Typography
            variant="overline"
            sx={{ letterSpacing: "0.14em", color: "secondary.main" }}
          >
            Aptos Devflow Playground
          </Typography>
          <Typography
            component="h1"
            variant="h1"
            sx={{ maxWidth: 820, mb: 1.5 }}
          >
            Validate Aptos payloads in under a minute.
          </Typography>
          <Typography
            variant="body1"
            sx={{ maxWidth: 760, color: "text.secondary" }}
          >
            {modeInfo}
          </Typography>
        </Box>

        <Alert severity="info" sx={{ borderRadius: 4 }}>
          Offline mode runs browser safe checks only. Online mode is available
          through the optional remote runner.
        </Alert>

        <Paper
          elevation={0}
          sx={{ p: 1, border: "1px solid rgba(22, 50, 79, 0.12)" }}
        >
          <Tabs
            value={tab}
            onChange={handleTabChange}
            variant="scrollable"
            scrollButtons="auto"
          >
            <Tab label="Validate" value="validate" />
            <Tab label="Fixtures" value="fixtures" />
            <Tab label="Report" value="report" />
          </Tabs>
        </Paper>

        {tab === "validate" ? (
          <Paper
            elevation={0}
            sx={{
              p: { xs: 2, md: 3 },
              border: "1px solid rgba(22, 50, 79, 0.12)",
            }}
          >
            <Stack spacing={2}>
              <Alert severity="info" sx={{ borderRadius: 3 }}>
                Paste an Aptos payload, choose the input type and run offline
                validation. The samples are bundled examples, but the checks are
                real validator rules from the toolkit.
              </Alert>
              <Stack
                direction={{ xs: "column", md: "row" }}
                spacing={1.5}
                flexWrap="wrap"
              >
                <FormControl sx={{ minWidth: 220 }}>
                  <Select
                    value={inputType}
                    displayEmpty
                    onChange={handleInputTypeChange}
                    MenuProps={selectMenuProps}
                    sx={{ backgroundColor: "#fffaf2" }}
                  >
                    <MenuItem disabled value="">
                      Input type
                    </MenuItem>
                    <MenuItem value="transaction-payload">
                      transaction payload
                    </MenuItem>
                    <MenuItem value="entry-function-call">
                      entry function call
                    </MenuItem>
                    <MenuItem value="generic-json">generic json</MenuItem>
                  </Select>
                </FormControl>
                <Button
                  variant="outlined"
                  onClick={() =>
                    setJsonInput(JSON.stringify(validSample, null, 2))
                  }
                >
                  Sample input
                </Button>
                <Button
                  variant="outlined"
                  color="secondary"
                  onClick={() =>
                    setJsonInput(JSON.stringify(invalidSample, null, 2))
                  }
                >
                  Sample invalid input
                </Button>
                <Button variant="text" onClick={() => setJsonInput("")}>
                  Clear
                </Button>
                <Button
                  variant="contained"
                  startIcon={<PlayArrowRounded />}
                  onClick={() => void handleValidate(jsonInput, inputType)}
                >
                  Validate
                </Button>
              </Stack>
              <TextField
                multiline
                minRows={16}
                value={jsonInput}
                onChange={handleJsonInputChange}
                fullWidth
              />
            </Stack>
          </Paper>
        ) : null}

        {tab === "fixtures" ? (
          <Paper
            elevation={0}
            sx={{
              p: { xs: 2, md: 3 },
              border: "1px solid rgba(22, 50, 79, 0.12)",
            }}
          >
            <Stack spacing={2}>
              <Alert severity="info" sx={{ borderRadius: 3 }}>
                Run a bundled fixture from the repository examples. This is a
                quick preview of the same fixture style used by the terminal
                harness.
              </Alert>
              <Stack direction={{ xs: "column", md: "row" }} spacing={1.5}>
                <FormControl sx={{ minWidth: 220 }}>
                  <Select
                    value={fixtureId}
                    displayEmpty
                    onChange={handleFixtureChange}
                    MenuProps={selectMenuProps}
                    sx={{ backgroundColor: "#fffaf2" }}
                  >
                    <MenuItem disabled value="">
                      Fixture
                    </MenuItem>
                    {fixtureOptions.map((fixture) => (
                      <MenuItem key={fixture.id} value={fixture.id}>
                        {fixture.label}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
                <Button
                  variant="contained"
                  startIcon={<PlayArrowRounded />}
                  onClick={() =>
                    void handleValidate(
                      JSON.stringify(
                        selectedFixture?.payload ?? validSample,
                        null,
                        2,
                      ),
                      selectedFixture?.kind,
                    )
                  }
                >
                  Run selected fixture
                </Button>
              </Stack>
              <TextField
                multiline
                minRows={14}
                fullWidth
                value={JSON.stringify(
                  selectedFixture?.payload ?? validSample,
                  null,
                  2,
                )}
                slotProps={{ input: { readOnly: true } }}
              />
            </Stack>
          </Paper>
        ) : null}

        {tab === "report" ? (
          <Paper
            elevation={0}
            sx={{
              p: { xs: 2, md: 3 },
              border: "1px solid rgba(22, 50, 79, 0.12)",
            }}
          >
            <Stack spacing={2}>
              <Alert severity="info" sx={{ borderRadius: 3 }}>
                Load an existing report file to inspect summary counts and top
                failures without running the CLI.
              </Alert>
              <Button variant="outlined" component="label">
                Upload report.json
                <input
                  hidden
                  type="file"
                  accept="application/json"
                  onChange={handleReportFileChange}
                />
              </Button>
              <Stack
                direction={{ xs: "column", sm: "row" }}
                spacing={1.5}
                useFlexGap
                flexWrap="wrap"
              >
                <Chip label={`Total ${summary.total}`} color="default" />
                <Chip label={`Pass ${summary.pass}`} color="success" />
                <Chip label={`Fail ${summary.fail}`} color="error" />
                <Chip label={`Warning ${summary.warning}`} color="warning" />
              </Stack>
              <Box>
                <Typography variant="subtitle1" sx={{ mb: 1 }}>
                  Top failures
                </Typography>
                <Stack direction="row" spacing={1} useFlexGap flexWrap="wrap">
                  {topFailures.length > 0 ? (
                    topFailures.map((failure) => (
                      <Chip key={failure} label={failure} variant="outlined" />
                    ))
                  ) : (
                    <Chip label="No failures loaded" />
                  )}
                </Stack>
              </Box>
            </Stack>
          </Paper>
        ) : null}

        <Paper
          elevation={0}
          sx={{
            p: { xs: 2, md: 3 },
            border: "1px solid rgba(22, 50, 79, 0.12)",
          }}
        >
          <Stack spacing={2}>
            <Typography variant="subtitle1">Validation results</Typography>
            <Typography variant="body2" color="text.secondary">
              This table shows ordered validator messages from the current run
              or uploaded report. Offline browser mode uses real shared rules,
              while online only checks stay skipped unless the optional remote
              runner is used.
            </Typography>
            <Stack direction={{ xs: "column", md: "row" }} spacing={1.5}>
              <Button
                variant="outlined"
                startIcon={<ContentCopyRounded />}
                onClick={() => navigator.clipboard.writeText(reportText)}
                disabled={!reportText}
              >
                Copy JSON report
              </Button>
              <Button
                variant="contained"
                color="secondary"
                startIcon={<CloudDownloadRounded />}
                onClick={downloadReport}
                disabled={!reportText}
              >
                Download report.json
              </Button>
            </Stack>

            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell>Rule</TableCell>
                  <TableCell>Severity</TableCell>
                  <TableCell>Message</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {messages.map(
                  (message: PlaygroundMessageRow, index: number) => (
                    <TableRow key={`${message.ruleId}-${index}`}>
                      <TableCell>{message.ruleId}</TableCell>
                      <TableCell sx={{ textTransform: "capitalize" }}>
                        {message.severity}
                      </TableCell>
                      <TableCell>{message.message}</TableCell>
                    </TableRow>
                  ),
                )}
              </TableBody>
            </Table>
          </Stack>
        </Paper>
      </Stack>
    </Container>
  );
}
