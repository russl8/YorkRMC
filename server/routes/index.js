const express = require('express');
const router = express.Router();
const puppeteer = require('puppeteer');
require("dotenv").config();

// Reusable browser instance
let browser;

router.get('/', async function (req, res, next) {
  try {
    const invalidCourse = req.query.courseCode === ("undefined Courses" || "undefined Current");
    if (invalidCourse) return res.json({ msg: "no render" });

    const course = req.query.courseCode;

    if (!browser) {
      browser = await puppeteer.launch({
        headless: true,
        args: [
          "--disable-setuid-sandbox",
          "--no-sandbox",
          "--single-process",
          "--no-zygote"
        ],
        executablePath: process.env.NODE_ENV === "production"
          ? process.env.PUPPETEER_EXECUTABLE_PATH
          : puppeteer.executablePath()
      });
    }

    const page = await browser.newPage();
    page.goto("https://www.ratemycourses.io/yorku");
    await page.waitForSelector(".MuiTableRow-root");

    const trHTML = await page.evaluate((courseCode) => {
      const rows = document.querySelectorAll(".MuiTableRow-root");
      for (const row of rows) {
        const courseCodeElement = row.querySelector("th a");
        if (courseCodeElement && courseCodeElement.innerText.trim() === courseCode) {
          return row.innerHTML;
        }
      }
      return null;
    }, course);

    if (trHTML) {
      const courseInfo = await page.evaluate((trHTML) => {
        const tempElement = document.createElement("div");
        tempElement.innerHTML = trHTML;
        const pattern = /(\d+)$/;
        const matches = tempElement.innerHTML.match(pattern);
        const numReviews = parseInt(matches[1]);
        const spans = tempElement.querySelectorAll("span.jss42");
        const spanTexts = Array.from(spans, (span) => span.textContent.trim());

        return {
          numReviews,
          overall: spanTexts[0],
          easiness: spanTexts[1],
          interest: spanTexts[2],
          usefulness: spanTexts[3]
        };
      }, trHTML);

      if (courseInfo.numReviews === 0) {
        return res.json({ msg: 'no course' });
      }

      return res.json({
        msg: 'success',
        numReviews: courseInfo.numReviews,
        overall: courseInfo.overall,
        easiness: courseInfo.easiness,
        interest: courseInfo.interest,
        usefulness: courseInfo.usefulness
      });

    } else {
      return res.json({ msg: 'no course' });
    }

    await page.close();
    await browser.close();

  } catch (err) {
    console.error("Error:", err);
    if (browser) {
      await browser.close();
    }
    return res.json({ msg: 'no course' });
  }
});

module.exports = router;
