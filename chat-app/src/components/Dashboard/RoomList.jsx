import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import RoomItem from './RoomItem';
import { useAuth } from '../../contexts/AuthContext';
import { useSocket } from '../../contexts/SocketContext';

const RoomList = ({ activeRoom, setActiveRoom, roomType = 'group' }) => {
  const [rooms, setRooms] = useState([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();
  const { socket, connected, onlineUsers } = useSocket();

  const fetchRooms = useCallback(async () => {
    try {
      const response = await axios.get('/rooms');
      // Filter rooms based on roomType
      const filteredRooms = response.data.filter(room => {
        if (roomType === 'group') {
          return room.roomType !== 'direct';
        }
        return room.roomType === roomType;
      });
      
      // Enhance rooms with online member count for groups
      const enhancedRooms = filteredRooms.map(room => {
        if (room.roomType !== 'direct') {
          const onlineMembers = room.members.filter(member => 
            onlineUsers.some(u => u.userId === member._id)
          );
          return {
            ...room,
            onlineMembersCount: onlineMembers.length,
            onlineMembers
          };
        }
        return room;
      });
      
      setRooms(enhancedRooms);
      setLoading(false);
    } catch (error) {
      console.error('Failed to fetch rooms:', error);
      setLoading(false);
    }
  }, [roomType, onlineUsers]);

  useEffect(() => {
    fetchRooms();
  }, [fetchRooms]);

  // Socket event handlers
  const handleRoomCreated = useCallback((newRoom) => {
    console.log('Room created event received:', newRoom);
    
    // Only add if it matches the current room type filter
    const shouldAdd = roomType === 'group' ? newRoom.roomType !== 'direct' : newRoom.roomType === roomType;
    
    if (shouldAdd) {
      setRooms(prevRooms => {
        // Check if room already exists to prevent duplicates
        const existingRoom = prevRooms.find(room => room._id === newRoom._id);
        if (existingRoom) {
          return prevRooms;
        }
        
        // Enhance with online member info for groups
        if (newRoom.roomType !== 'direct') {
          const onlineMembers = newRoom.members.filter(member => 
            onlineUsers.some(u => u.userId === member._id)
          );
          newRoom.onlineMembersCount = onlineMembers.length;
          newRoom.onlineMembers = onlineMembers;
        }
        
        return [...prevRooms, newRoom];
      });
    }
  }, [roomType, onlineUsers]);

  const handleRoomUpdated = useCallback((updatedRoom) => {
    console.log('Room updated event received:', updatedRoom);
    setRooms(prevRooms => 
      prevRooms.map(room => {
        if (room._id === updatedRoom._id) {
          // Enhance with online member info for groups
          if (updatedRoom.roomType !== 'direct') {
            const onlineMembers = updatedRoom.members.filter(member => 
              onlineUsers.some(u => u.userId === member._id)
            );
            updatedRoom.onlineMembersCount = onlineMembers.length;
            updatedRoom.onlineMembers = onlineMembers;
          }
          return updatedRoom;
        }
        return room;
      })
    );
  }, [onlineUsers]);

  const handleRoomDeleted = useCallback((roomId) => {
    console.log('Room deleted event received:', roomId);
    setRooms(prevRooms => 
      prevRooms.filter(room => room._id !== roomId)
    );
  }, []);

  // Listen for room updates via socket
  useEffect(() => {
    if (!socket || !connected) return;

    console.log('Setting up socket listeners for room events');

    // Listen for socket events
    socket.on('roomCreated', handleRoomCreated);
    socket.on('roomUpdated', handleRoomUpdated);
    socket.on('roomDeleted', handleRoomDeleted);
    
    // Also listen for the alternative event name (from your socket handler)
    socket.on('room_created', (data) => {
      console.log('Room created alternative event:', data);
      if (data.room) {
        handleRoomCreated(data.room);
      }
    });

    // Cleanup listeners
    return () => {
      console.log('Cleaning up socket listeners');
      socket.off('roomCreated', handleRoomCreated);
      socket.off('roomUpdated', handleRoomUpdated);
      socket.off('roomDeleted', handleRoomDeleted);
      socket.off('room_created');
    };
  }, [socket, connected, handleRoomCreated, handleRoomUpdated, handleRoomDeleted]);

  // Re-fetch rooms when socket reconnects to ensure we have the latest data
  useEffect(() => {
    if (connected && rooms.length > 0) {
      console.log('Socket reconnected, refreshing rooms');
      fetchRooms();
    }
  }, [connected, fetchRooms]);

  // Update online member counts when online users change
  useEffect(() => {
    setRooms(prevRooms => 
      prevRooms.map(room => {
        if (room.roomType !== 'direct') {
          const onlineMembers = room.members.filter(member => 
            onlineUsers.some(u => u.userId === member._id)
          );
          return {
            ...room,
            onlineMembersCount: onlineMembers.length,
            onlineMembers
          };
        }
        return room;
      })
    );
  }, [onlineUsers]);

  if (loading) {
    return (
      <div className="flex justify-center p-4">
        <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div>
      {rooms.length === 0 ? (
        <p className="text-center text-gray-500 dark:text-gray-400 p-4">
          {roomType === 'group' ? 'No group chats available. Create one!' : 'No rooms available. Create one!'}
        </p>
      ) : (
        <ul className="space-y-1">
          {rooms.map(room => (
            <RoomItem 
              key={room._id}
              room={room}
              isActive={activeRoom && activeRoom._id === room._id}
              onClick={() => setActiveRoom(room)}
              showOnlineCount={room.roomType !== 'direct'}
            />
          ))}
        </ul>
      )}
    </div>
  );
};

export default RoomList;