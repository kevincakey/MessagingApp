import React, { useState } from 'react';

const Chat = ({ username, message, verified, id, socket, messageArray}) => {
  const [displayMessage, setDisplayMessage] = useState(message);
  const [editedMessage, setEditedMessage] = useState(displayMessage);
  const [isEditing, setIsEditing] = useState(false);

  const handleEdit = () => {
    setIsEditing(true);
  };

  const handleSave = () => {
    // Emit the edit message event to the server
    setDisplayMessage(editedMessage);
    messageArray[messageArray.findIndex((message) => message._id === id)].message.text = editedMessage;
    socket.emit('editMessage', { messageId: id, editedMessage, messageArray, displayMessage });

    setIsEditing(false);
  };

  const handleChange = event => {
    setEditedMessage(event.target.value);
  };

  return (
    <div>
      <div>
        <strong>{username}</strong>:
      </div>
      {isEditing ? (
        <div>
          <textarea value={editedMessage} onChange={handleChange} />
          <button onClick={handleSave}>Save</button>
        </div>
      ) : (
        <div>
          {displayMessage}
          {verified && <button onClick={handleEdit}>Edit</button>}
        </div>
      )}
    </div>
  );
};

export default Chat;