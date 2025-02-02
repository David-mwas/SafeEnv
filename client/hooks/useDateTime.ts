export const convertDateTime = (timestampString) => {
  //   const timestampString = "2024-03-18T21:01:03.158Z";
  const date = new Date(timestampString);

  const options: Intl.DateTimeFormatOptions = { year: "numeric", month: "long", day: "numeric" };
  return date.toLocaleDateString("en-US", options);
};
