import { FlipText } from "./magicui/flip-text";

function NotFound() {
  return (
    <div className="flex flex-col items-center justify-center h-screen space-y-4 bg-gray-900 text-white">
      <h1 className="text-2xl font-bold">
        <FlipText className="text-6xl font-bold" >
        404 Not Found
        </FlipText>
      </h1>
      <p className="text-base font-bold">Sorry, that page does not exist</p>
    </div>
  );
}

export default NotFound;
