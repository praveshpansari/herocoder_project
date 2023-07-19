const axios = require("axios");
const fs = require("fs");

const URI = "https://herocoders.atlassian.net/";

const main = async () => {
  const components = await getComponents();
  const issues = await getIssues();

  if (!components.length || !issues) {
    console.log(
      "Not valid data, there should be atleast one component & one issue"
    );
    return;
  }

  const answer = [];

  components.forEach((component) => {
    answer.push(`${component.name}: ${issues[component.id]}`);
  });

  // write to file
  fs.writeFile("output.txt", answer.join("\n"), (err) => {
    if (err) {
      console.error(err);
    }
  });

  console.log(answer);
};

// get components with no lead
const getComponents = async () => {
  const response = await axios.get(`${URI}rest/api/3/project/SP/components`);

  const components = response.data;

  if (!components) return [];

  return components.filter((component) => !component.lead);
};

// get components with total issues
const getIssues = async () => {
  const issues = [];
  let total;

  try {
    // fetch until all data received, 100 at a time
    do {
      const response = await axios.get(
        `${URI}rest/api/3/search?jql=project=SP AND component!=empty&startAt=${issues.length}&maxResults=100`
      );

      total = response.data.total;

      issues.push(...response.data.issues);
    } while (issues.length < total);
  } catch (error) {
    console.error("Error encountered while fetching JIRA data: " + error);
  }

  if (!issues) return null;

  // map all components to no. of issues
  return issues.reduce((obj, val) => {
    let components = val.fields.components;
    obj[components[0].id] = (obj[components[0].id] || 0) + 1;
    return obj;
  }, {});
};

main();
