/* eslint-disable no-undef */


// A map to store render data for each tab
const tabRenderData = {};



// Listen for incoming messages from background script
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.tabId && message.renderMethod && message.data) {
    // Store the render data for the tab, then render the tab
    tabRenderData[message.tabId] = { renderMethod: message.renderMethod, data: message.data };
    renderTab(message.tabId);
  }
});



// render data for a specific tab
function renderTab(tabId) {
  const data = tabRenderData[tabId];
  if (data) {
    render(data.renderMethod, data.data);
  }
}


async function main() {
  //loding text can be changed in both try,catch. 
  const loadingText = document.createElement("p");

  try {
    //defult render method
    let renderMethod = "no render";

    //get course code
    const courseTitleArray = document.querySelector('h1[style="COLOR:#CC0000"]')?.textContent?.split(" ");
    if (!courseTitleArray) {
      console.error("Course title element not found.");
      return;
    }
    const courseCode = courseTitleArray[0].split("/")[1] + " " + courseTitleArray[1];

    //loading text
    loadingText.textContent = "Getting reviews from ratemycourses.io...";
    const courseTitle = document.querySelector('h1');
    courseTitle.appendChild(loadingText);

    //create a url with the coursecode to send to backend
    const dataToSend = { courseCode: courseCode };
    const searchParams = new URLSearchParams(dataToSend).toString();
    const urlWithParams = `https://yorkrmc.onrender.com/?${searchParams}`;


    //fetch data from backend
    const response = await fetch(urlWithParams);
    if (response.ok) {
      const data = await response.json();
      // console.log(data);
      renderMethod = data.msg;

      loadingText.textContent = "";

      render(renderMethod, data);
      chrome.runtime.sendMessage({ renderMethod, data });
    } else {
      console.error("Fetch request failed with status:", response.status);
    }


  } catch (error) {
    loadingText.textContent = "An error occured. Please try again.";
    console.error("An error occurred:", error);
  }
}


//inject fetched data
function render(renderMethod, data) {
  const courseTitle = document.querySelector('h1');

  if (renderMethod === "no render") {
    // No action.
  } else if (renderMethod === "no course") {
    // Course does not exist on RMC. Check if the content is already injected
    if (!courseTitle.querySelector(".no-course-message")) {
      const span = document.createElement("span");
      const p = document.createElement("p");
      p.textContent = "This course currently has no reviews. If you have taken this course, go write one at ";

      //creating link to RMC page
      const rmcLink = document.createElement("a");
      rmcLink.textContent = "www.ratemycourses.io/yorku!"
      rmcLink.href = "https://www.ratemycourses.io/yorku"
      p.appendChild(rmcLink)
      span.appendChild(p);
      span.className = "no-course-message"; // Add a class to identify this content
      courseTitle.appendChild(span)
    }



  } else if (renderMethod === "success") {

    // Course exists on RMC. Check if the content is already injected
    if (!courseTitle.querySelector(".rmc-reviews")) {
      //locate course title and create a span under it
      const span = document.createElement("span");

      //create span text "Reviews from www.ratemycourses.io:"
      const spanText = document.createElement("p")
      spanText.textContent = "Reviews from ";

      //creating link to RMC page
      const rmcLink = document.createElement("a");
      rmcLink.textContent = "www.ratemycourses.io: "
      rmcLink.href = "https://www.ratemycourses.io/yorku"
      spanText.appendChild(rmcLink)

      // texts for (n reviews)
      const spanText2 = document.createElement("span")
      spanText2.textContent = `(${data.numReviews} review${data.numReviews === 1 ? "" : "s"})`
      spanText.appendChild(spanText2)

      //appending the span to the courseTitle
      span.appendChild(spanText)
      courseTitle.appendChild(span)

      //add the ratings
      const reviewSpan = document.createElement("span");
      const reviewSpanText = document.createElement("p");
      reviewSpanText.textContent = `Overall: ${data.overall}/5 Easiness: ${data.easiness}/5 Interest: ${data.interest}/5 Usefulness: ${data.usefulness}/5`

      reviewSpan.appendChild(reviewSpanText)
      span.className = "rmc-reviews"; // Add a class to identify this content
      courseTitle.appendChild(reviewSpan)
    }
  }

}



main();
