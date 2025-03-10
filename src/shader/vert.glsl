#version 300 es
uniform mat4 P;
uniform mat4 V;

in vec3 aPos;
in vec3 aNorm;
in float aAO;

out vec3 pos;
out vec3 norm;
out float ao;


void main()
{
    pos = aPos;
    norm = aNorm;
    ao = aAO;

    gl_Position = P * V * vec4(aPos, 1.0f) + vec4(0.025f, vec3(0.0f));
}